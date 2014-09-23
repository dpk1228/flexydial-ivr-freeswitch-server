'use strict';

exports = module.exports = function(app, mongoose) {
  var missedcallSchema = new mongoose.Schema({
    _id: {type: String, unique: true},
    did_number: String,
    client_id: String,
    incoming_phone_number: String,
    call_time: String,
    flag: { type: Number,default : 0},
    timeCreated: { type: Date, default: Date.now },
    timeModified: { type: Date },
  });



  missedcallSchema.index({ _id: 1 }, {unique: true});
  missedcallSchema.index({ did_number: 1 });
  missedcallSchema.index({ client_id: 1 });
  missedcallSchema.index({ incoming_phone_number: 1 });
  missedcallSchema.index({ call_time: 1 });
  missedcallSchema.index({ flag: 1 });
  missedcallSchema.index({ timeModified: 1 });
  app.db.model('missedcall', missedcallSchema);
};
