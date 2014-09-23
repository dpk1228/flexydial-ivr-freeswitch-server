'use strict';

exports = module.exports = function(app, mongoose) {
  var didSchema = new mongoose.Schema({
    did_number: {type: String, unique: true},
    ip_address: String,
    client_name: String,
    script_detail: String,
    app_name : {type: String, default: ''},
    isActive: {type: Boolean, default: true},
    timeCreated: { type: Date, default: Date.now },
    timeModified: { type: Date },
  });



  didSchema.index({ did_number: 1 }, {unique: true});
  didSchema.index({ ip_address: 1 });
  didSchema.index({ client_name: 1 });
  didSchema.index({ script_detail: 1 });
  didSchema.index({ app_name: 1 });
  didSchema.index({ timeCreated: 1 });
  didSchema.index({ timeModified: 1 });
  app.db.model('did', didSchema);
};
