'use strict';

exports = module.exports = function(app, mongoose) {
  var accountSummarySchema = new mongoose.Schema({
    client_id: {type: String, unique: true},
    total_credit: Number,
    credit_balance: Number,
    pulse_rate: Number,
    flag: {type: Number, default: 0},
    timeCreated: { type: Date, default: Date.now },
    timeModified: { type: Date },
  });



  accountSummarySchema.index({ client_id: 1}, {unique: true});
  accountSummarySchema.index({ total_credit: 1 });
  accountSummarySchema.index({ credit_balance: 1 });
  accountSummarySchema.index({ pulse_rate: 1 });
  accountSummarySchema.index({ flag: 1 });
  accountSummarySchema.index({ timeModified: 1 });
  app.db.model('account_detail', accountSummarySchema);
};

