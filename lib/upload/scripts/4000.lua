function makeCDREntry()
file = io.popen("tail -1 /var/log/freeswitch/cdr-csv/Master.csv")
fields = file:read("*all")
local index=0
local pindex=0

index=string.find(fields,",",1)
cidname = string.sub(fields,2,index-2)

pindex=index
index=string.find(fields,",",pindex+1)
cidnumber = string.sub(fields,pindex+2,index-2)

pindex=index
index=string.find(fields,",",pindex+1)
dnumber = string.sub(fields,pindex+2,index-2)

pindex=index
index=string.find(fields,",",pindex+1)
context = string.sub(fields,pindex+2,index-2)

pindex=index
index=string.find(fields,",",pindex+1)
start_stamp = string.sub(fields,pindex+2,index-2)

pindex=index
index=string.find(fields,",",pindex+1)
ans_stamp = string.sub(fields,pindex+2,index-2)

pindex=index
index= string.find(fields,",",pindex+1)
end_stamp = string.sub(fields,pindex+2,index-2)

pindex=index
index=string.find(fields,",",pindex+1)
duration = string.sub(fields,pindex+2,index-2)

pindex=index
index=string.find(fields,",",pindex+1)
billduration = string.sub(fields,pindex+2,index-2)

pindex=index
index=string.find(fields,",",pindex+1)
hangupcause = string.sub(fields,pindex+2,index-2)

pindex=index
index=string.find(fields,",",pindex+1)
uuid = string.sub(fields,pindex+2,index-2)

pindex=index
index=string.find(fields,",",pindex+1)
buuid = string.sub(fields,pindex+2,index-2)

pindex=index
index=string.find(fields,",",pindex+1)
accountcode = string.sub(fields,pindex+2,index-2)


local cur = assert(con:execute("Insert into \"IVR_"..clientId.."_log\" values('"..number.."','"..cidname.."','"..cidnumber.."','"..dnumber.."','"..start_stamp.."','"..ans_stamp.."','"..end_stamp.."',"..duration..",'"..hangupcause.."','"..uuid.."','"..buuid.."','"..accountcode.."')") )

end


function getClientId()
	local cur = assert(con:execute("select user_id_id from \"IVR_clientpri\" where pri="..priNumber))
	local row = cur:fetch({},'a')
	if row == nil then
	  session:speak("Under construction")
	else
	  return row.user_id_id
	end  
end  

function getTimeString(duration)
	local sec=duration%60;
	local min =0
	local hour=0
	if (duration > 59 ) then
		local min=duration/60;
	else
		min=0;
	end

	if (duration > 3600 ) then
		hour=duration/3600;
	else
		hour=0;
	end
return (hour..":"..min..":"..sec);
end

function setDBConnection()
	luasql = require "luasql.postgres";
	envv=assert(luasql.postgres());
	con=assert(envv:connect('mydb','postgres','whatisthis','127.0.0.1','5432'));
end

function isBWListEnabled()
	local cur = assert (con:execute("select count(*) from \"IVR_setting\" where user_id_id="..clientId.."and bwlist=True"))
	local row = cur:fetch({},'n')
	if row == nil then
	  return false
	end  
	
	if row.count == nil then
	  return false
	else  
	  if row.count > 0 then
	    return true
	  end  
	end  
end

function isAllowed()
  	local cur = assert (con:execute("select count(*) from \"IVR_blackwhitelist\" where user_id_id="..clientId.." and phone_no="..caller_id.." and status=True"))
	local row = cur:fetch({},'n')
	if row == nil then
	  return true
	end
	if row.count > 0 then
	  return false
	else  
	  return true
	end  
end

function getAudioPath(id)
  
	local cur = assert (con:execute("select audio_file from \"IVR_audio\" where id="..id))
	local row = cur:fetch({},'a')
	return "/home/satyajeet/workspace/VAS/src/VAS/media/"..row.audio_file	
end  

function getText(id)
	local cur = assert (con:execute("select text from \"IVR_text\" where id="..id))
	local row = cur:fetch({},'a')
	if row == nil then
	  return "No response found"
	else
	  return row.text
	end  
end  

function isResponseMapped(number)
  	local cur = assert (con:execute("select map from \"IVR_ivrentry\" where user_id_id="..clientId.." and number='"..number.."'"))
	local row = cur:fetch({},'a')
	if row==nil then
	  return false
	end
	
	if (row.mode ==nil) then
	  return true
	else
	  return false
	end  
end  

function getLastMappedNumber(number)
	local loopControl=true
	while loopControl do
	  local cur = assert (con:execute("select map from \"IVR_ivrentry\" where user_id_id="..clientId.." and number='"..number.."'"))
	  local row = cur:fetch({},'a')
	  if row.map == '' then
	    loopControl=false
	  else  
	    number = row.map
	  end 
	end
	return number
end

function getMode(number)
 	local cur = assert (con:execute("select mode from \"IVR_ivrentry\" where user_id_id="..clientId.." and number='"..number.."'"))
	local row = cur:fetch({},'a')
	if row==nil then
	  return 'none'
	end  
	if (row.mode==nil) then
	  return 'none'
	else 
	  return row.mode
	end  
end

function isChoicesAvailable()
	local cur = assert (con:execute("select number from \"IVR_ivrentry\" where user_id_id="..clientId.." and number like '"..number.."%,'"))
	local row = cur:fetch({},'a')
	if row == nil then 
	  return false
	end  
	if (row.number==nil) then
	  return false
	else 
	  return true
	end  
end

function getMaxDigits(number)
	local cur = assert (con:execute("select number from \"IVR_ivrentry\" where user_id_id="..clientId.." and number like '"..number.."%,' order by number asc "))
	local row = cur:fetch({},'a')
	local start=0
	local temp=0
	local temp1=0
	local tindex=index
	local str = row.number
	freeswitch.consoleLog("INFO",number.." "..index)
	while tindex > 0  do
		temp=string.find(str,',',start);
		start=temp+1;
		temp1=string.find(str,',',start);
		tindex=tindex-1;	
	end
	local bound=temp1-temp-1;
	return (bound);
end

function getMinDigits(number)
  	local cur = assert (con:execute("select number from \"IVR_ivrentry\" where user_id_id="..clientId.." and number like '"..number.."%,' order by number desc"))
	local row = cur:fetch({},'a')
	local start=0
	local temp=0
	local temp1=0
	local tindex=index
	local str=row.number
	while tindex > 0  do
		temp=string.find(str,',',start);
		start=temp+1;
		temp1=string.find(str,',',start);
		tindex=tindex-1;	
	end
	local bound=temp1-temp-1;
	return (bound);
end

function getTerminator(number)
	local cur = assert (con:execute("select terminator from \"IVR_ivrentry\" where user_id_id="..clientId.." and number='"..number.."'"))
	local row = cur:fetch({},'a')
	  
	return row.terminator
end  

function getAllowedDelay()
	local cur = assert (con:execute("select delay from \"IVR_setting\" where user_id_id="..clientId..""))
	local row = cur:fetch({},'a')
	if (row == nil) then
	  return 3000
	else
	  if row.delay ~= nil then 
	    return row.delay
	  end
	end  
end  

function getMaxAttempts()
	local cur = assert (con:execute("select maxattempt from \"IVR_setting\" where user_id_id="..clientId..""))
	local row = cur:fetch({},'a')
	if (row == nil) then
	  return 3
	else
	  if row.maxattempt ~= nil then
	      return row.maxattempt
	  end    
	end      
end  

function getScriptMode(id)
	local cur = assert(con:execute("select where from \"IVR_script\" where user_id_id="..clientId.." and id='"..id.."'"))
	local row = cur:fetch({},'a')
	return row.where
end		

function setIndex()
    local tempNumber=number
    local tindex =1
    local count = 1
    while string.find(tempNumber,',',tindex) do
	count=count+1
    end  
    return count
end

function rightReponse(id)
	local cur = assert(con:execute("select count(*) from \"IVR_ivrentry\" where user_id_id="..clientId.." and number='"..id.."'"))
	local row = cur:fetch({},'a')
	if row == nil then
	  return false
	else
	  return true
	end  
end  

function doCallForwarding(id)
end

function executeScript(id)
end  

freeswitch.consoleLog("INFO","Starting")
setDBConnection()
session:set_tts_params("flite", "kal")
session:answer()
startTime=os.time()
callerID=session:getVariable("caller_id_number")
priNumber = session:getVariable("destination_number")
clientId = getClientId()
api = freeswitch.API()

if isBWListEnabled() then
	if not isAllowed() then
		local cur = assert (con:execute("select audio_file_id from \"IVR_otheraudio\" where user_id_id="..clientId.." and audio_choice='bwaudio'"))
		local row = cur:fetch({},'n')
		
		if row.audio_file_id ~= nil then
		  local audio_path = getAudioPath(row.audio_file_id)
		  session:streamFile(audio_path)
		else
		  session:speak("Call can not be completed, contact system administrator");  
		end  
		session:hangup()  
	end
end
local cur = assert (con:execute("select audio_file_id from \"IVR_otheraudio\" where user_id_id="..clientId.." and audio_choice='welcome'"))
local row = cur:fetch({},'n')
if row  ~= nil then
      if row.audio_file_id ~= nil then
	  local audio_path = getAudioPath(row.audio_file_id)
	  session:streamFile(audio_path)	
      end  
end
index=1;
sessionControl=true;
session:setAutoHangup(false);
number = priNumber
number=number..','
delay = getAllowedDelay()
maxAttempts = getMaxAttempts()
local cur = assert(con:execute("select audio_file_id from \"IVR_otheraudio\" where user_id_id="..clientId.." and audio_choice='inputerror'"))
local row = cur:fetch({},'a')
errorAudio = getAudioPath(row.audio_file_id)

while sessionControl and session:ready()==true do
	if isResponseMapped(clientId,number) then
	    number= getLastMappedNumber(number)
	    index = setIndex()
	end
	    mode =getMode(number)
	if (mode=='none' or mode==nil) then
	    sessionControl=false
	    session:hangup()
	elseif mode=='audio' then
	    local cur = assert(con:execute("select audio_response_id from \"IVR_ivrentry\" where user_id_id="..clientId.." and number='"..number.."'"))
	    local row = cur:fetch({},'a')
	    audio = getAudioPath(row.audio_response_id)
	  
	    if isChoicesAvailable() then
		max = getMaxDigits(number)
		min = getMinDigits(number)
		terminator = getTerminator(number)
		digits = session:playAndGetDigits(min, max, maxAttempts, delay, terminator, audio, errorAudio, "\\d+")
		if rightReponse(number..digits..',') then
		      number = number..digits..','
		      index = index+1
		end
	    else
		session:streamFile(audio)
		session:hangup()
	    end	
	elseif mode=='text' then
		local cur = assert(con:execute("select text_response_id from \"IVR_ivrentry\" where user_id_id="..clientId.." and number='"..number.."'"))
		local row = cur:fetch({},'a')
		local text = getText(row.text_response_id)
		local maxAttempt = maxAttempts
		
		if isChoicesAvailable(number) then
		      max = getMaxDigits(number)
		      terminator = getTerminator(number)
		      delay = getAllowedDelay()
		      while maxattempt ~= 0 do
			    session:speak(text)		      
			    digits = session:getDigits(max,terminator,delay)
			    if rightReponse(number..digits..',') then
			      number = number..digits..','
			      index = index + 1
			      break
			    else
			      session:streamFile(errorAudio)
			    end  
		      end	    
		else     
		      session:speak(text)	
		      sessionControl=false	 	      
		end      
	elseif mode=='script' then
		local cur = assert(con:execute("select script_response_id from \"IVR_ivrentry\" where user_id_id="..clientId.." and number='"..number.."'"))
		local row = cur:fetch({},'a')
		local id = row.script_response_id
		local scriptMode = getScriptMode(id)
		if (scriptMode) then
		      local cur = assert(con:execute("select phone_id from \"IVR_script\" where user_id_id="..clientId.." and id='"..id.."'"))
		      local row = cur:fetch({},'a')
		      doCallForwarding(row.phone_id)
		else
		      excuteScript(id)
		end
		local tempNumber = string.reverse(number)
		local tempIndex = string.find(tempNumber,',',2)
		number = string.reverse(string.sub(tempNumber,tempIndex))
	end
	
end

endTime=os.time();
duration=startTime-endTime;


makeCDREntry()









-- durationString=getTimeString(duration);
-- startTimeString=getTimeString(duration);

-- sqlString="insert into log (caller_id,number,toc,duration,path) values('"..session:getVariable("caller_id_number").."','"..number.."','"..startTimeString.."','".."','"..durationString.."','')";

-- res=assert(con:execute(sqlString));
session:hangup();
session:destroy();

