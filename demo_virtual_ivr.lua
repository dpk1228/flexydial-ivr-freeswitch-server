hangupHookDir = '/usr/share/freeswitch/scripts/'
recordDir = '/usr/share/freeswitch/recordings/'
audioDir = '/usr/share/freeswitch/audios/'
voicemailDir = '/usr/share/freeswitch/voicemail/'
typeOfWelcomeMsg='';
welcomeResponse='';



function myHangupHook(s, status, arg)
    freeswitch.consoleLog("NOTICE", "myHangupHook: " .. status .. "\n")
    file = readfile("/home/satyajeet/IVR_Audio/satyajeet.wav")
    print ("b :"..file)
    local ftp = require("socket.ftp")
    a,b=ftp.put("ftp://satyajeet:whatisthis@localhost/temp/maaKiAakh.wav;type=i",file)
end

function readfile(name)
    local f = io.open(name, "rb")
    if not f then return nil end
    local s = f:read("*a")
    f:close()
    return s
end

function setDb()
  mongo = require('mongo')
  db = assert(mongo.Connection.New())
  assert(db:connect('localhost'))
end


function isWelcomeMsgAvailable()
  freeswitch.consoleLog("info","checking welocme message for virtual ivr "..didNumber)
   local q = assert(db:query('freeswitch.welcomedids', { query = { did = didNumber } }))
     if (q ~= nil) then	
	  for result in q:results() do
		typeOfWelcomeMsg = result.type
		welcomeResponse = result.response 
		return true
	  end
     else
	  return false
     end	    
end

setDb()
didNumber = session:getVariable("destination_number")
status = false;
session:set_tts_params("flite", "kal")
--[[
  local q = db:query('freeswitch.dids', { query= {did_number = didNumber} })
  if ( q ~= nil ) then
    for result in q:results() do
        cid = result.client_name
    status = result.isActive 
        break
    end
  end
--]] 
--  freeswitch.consoleLog("info", "Client id : "..cid.."Status : "..tostring(status))
  
  creditBalance = 0
--  if (status) then
      
      local q = assert(db:query('freeswitch.account_details', { }))
      if (q ~= nil) then	
	  for result in q:results() do
		 cid,did= result.client_id:match("([^,]+):([^,]+)")
		if (did == didNumber) then
	   	        freeswitch.consoleLog("INFO","Did matched "..did.." Client: "..cid)
			clientId = cid
			creditBalance = tonumber(result.credit_balance)
			break
		end
	  end
      end	    
--  end

freeswitch.consoleLog("INFO","creditBalance :"..creditBalance)

if ( creditBalance > 0 ) then
  if (session:ready()) then
    --session:execute("set","session_in_hangup_hook=true")
     --session:execute("export","api_hangup_hook=lua "..hangupHookDir.."hook_test.lua")
     session:execute("set","api_hangup_hook=lua "..hangupHookDir.."hook_test.lua")
     session:answer()
     session:execute("set","clientId="..clientId)
    -- session:streamFile(audioDir.."welcome.wav")	
--[[     if (isWelcomeMsgAvailable()) then
	if ( typeOfWelcomeMsg == 'text') then
	  session:speak(welcomeResponse)
	else
	  session:streamFile(welcomeResponse)
	end 
     end 
--]] 
     maxTry = 3
     while (maxTry ~= 0) do
     digits = '' 
     session:flushDigits()
     digits = session:playAndGetDigits(1,4,3,5000,'#',audioDir..'enterExtension.wav',audioDir..'invalidDigit.wav', "\\d+")
     if (digits == '')then
        session:streamFile(audioDir..'noInput.wav')
        session:hangup()
     end
     
    local q = assert(db:query('freeswitch.extensions', { query= { did = didNumber } }))
	number = ''
	if (q ~= nil) then	
	    for result in q:results() do
		  if ( result.extension == digits) then
		    number = result.number
		  break
		  end
	    end
	end	     
    
    if (number=='') then
      session:streamFile(audioDir..'invalidInput.wav')
      maxTry = maxTry - 1
      if(maxTry == 0) then
        session:streamFile(audioDir..'tooManyAttempts.wav')
        session:hangup()
      end  
    else
	maxTry = 0
        uuid = session:getVariable("uuid")
        callerId = session:getVariable("caller_id_number")
        freeswitch.consoleLog("info",'Trying to bridge call to '..number)
        session:streamFile(audioDir..'pleaseWait.wav');
        session:setVariable("ringback", "%(2000,4000,440,480)")
        newSession = freeswitch.Session("user/1001")
        dateNow = os.date ("*t")
        nDateNow = os.time{year=dateNow.year, month=dateNow.month,day=dateNow.day, hour=dateNow.hour, min=dateNow.min, sec=dateNow.sec,isdst=dateNow.isdst}
        callTime = dateNow.year.."-"..dateNow.month.."-"..dateNow.day.." ".. dateNow.hour..":"..dateNow.min..":"..dateNow.sec
        if (newSession:ready()) then
            newSession:execute("set","clientId="..clientId)
            newSession:execute("set","api_hangup_hook=lua "..hangupHookDir.."hook_test.lua")
            freeswitch.consoleLog("info","New session is ready")
            local uuid = newSession:getVariable("uuid")
	    session:execute("set","bridgedUuid="..uuid)
            newSession:execute("record_session",recordDir..uuid..".wav")
            --newSession:setHangupHook("myHangupHook", "uuid")
            freeswitch.bridge(session,newSession)
            maxTry=0
            --freeswitch.consoleLog("info",'Bridged call to'..number)
        else
          local hcause = ''
          hcause = newSession:hangupCause()
          freeswitch.consoleLog("info",'HangupCause : '..hcause)
          
          if (hcause ~= 'NORMAL_CLEARING') then
        freeswitch.consoleLog("info","Done playing prompt")
        local time = os.date("*t")
        todayDate = time.day..':'..time.month..':'..time.year
        todayTime = time.hour..':'..time.min..':'..time.sec
        local max_len_secs = 120
        local silence_threshold = 500
        local silence_secs = 20
       -- one , two= number:match("([^,]+)/([^,]+)")
        --local fileName = audioDir..todayDate..'_'..session:getVariable("destination_number")..'_'..one.."_"..two..(todayDate..'_'..todayTime)..'.wav'
        session:streamFile(audioDir..'vmprompt.wav')
        
        session:streamFile("tone_stream://v=-7;%(100,0,941.0,1477.0);v=-7;>=2;+=.1;%(1000, 0, 640)")
        session:execute("flush_dtmf")
        startTime = os.time() 
        session:recordFile(voicemailDir..uuid..'.wav',max_len_secs,silence_threshold,silence_secs)
        endTime = os.time()
        dur =  endTime - startTime 
        maxTry=0
        assert(db:insert('freeswitch.voicemails', { _id= uuid , did_number = tostring(didNumber) , client_id = cid , incoming_phone_number = callerId, call_time = callTime, duration = dur, call_to_number = number, flag = 0 }))

        freeswitch.consoleLog("info","Dekho me yha b aagya")
        freeswitch.email("dpk.1228@gmail.com",
                 "uneedtomailme@gmail.com",
                 "subject: Voicemail from flexydial",
                 "Hello,\n\nYou've got a voicemail, click the attachment to listen to it.",
                 voicemailDir..uuid..'.wav'
                        )


        --session:streamFile(fileName)
        --session:hangup()
          else
        session:hangup()
          end  
        end     
    end  
     end 
   end  
end

