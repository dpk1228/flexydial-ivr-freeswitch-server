'use strict';

exports = module.exports = function(app, mongoose) {
  var voiceblastercdrSchema = new mongoose.Schema({
    _id: {type: String, unique: true},
    did_number: String,
    client_id: String,
    duration: String,
    no_of_pulse: Number,
    hangup_cause: String,
    caller_name: String,
    phone_number: String,
    wait_by_fs: String,
    time_to_answer: String,
    call_time: String,
    flag: String,
    timeCreated: { type: Date, default: Date.now },
    timeModified: { type: Date },
  });



  voiceblastercdrSchema.index({ _id: 1 }, {unique: true});
  voiceblastercdrSchema.index({ did_number: 1 });
  voiceblastercdrSchema.index({ client_id: 1 });
  voiceblastercdrSchema.index({ duration: 1 });
  voiceblastercdrSchema.index({ no_of_pulse: 1 });
  voiceblastercdrSchema.index({ hangup_cause: 1 });
  voiceblastercdrSchema.index({ phone_number: 1 });
  voiceblastercdrSchema.index({ wait_by_fs: 1 });
  voiceblastercdrSchema.index({ time_to_answer: 1 });
  voiceblastercdrSchema.index({ call_time: 1 });
  voiceblastercdrSchema.index({ flag: 1 });
  voiceblastercdrSchema.index({ timeModified: 1 });
  app.db.model('voiceblastercdr', voiceblastercdrSchema);
};
