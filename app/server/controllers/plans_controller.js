var crypto = require('crypto');
var stripe = require('stripe')(process.env.STRIPE_SECRET);
var handleError = require('../lib/error');
var Plan = require('../models/plan');

module.exports = {
  index: function *(next) {
    try {
      var plans = yield getPlans(this.params.product);
      var ret = [];

      for (var i = 0, l = plans.length; i < l; i++) {
        var plan = plans[i];

        ret.push({
          name: plan.name,
          stripe_id: plan.stripe_id,
          product_id: plan.product_id
        });
      }

      this.body = ret;
    } catch (e) {
      handleError.call(this, e);
    }
  },

  create: function *(next) {
    this.accepts('application/json');

    var body = this.request.body;

    body.id = crypto.randomBytes(10).toString('base64');
    body.currency = body.currency || 'usd';

    try {
      var stripePlan = yield createStripePlan(body);
      var plan = yield savePlan(stripePlan, this.params.product);

      this.body = { stripe_plan_id: plan.stripe_id };
    } catch (e) {
      handleError.call(this, e);
    }
  },

  show: function *(next) {
    try {
      this.body = yield retrieveStripePlan(this.params.plan);
    } catch (e) {
      handleError.call(this, e);
    }
  },

  /**
   * @method update()
   * @body { name: String }
   * Stripe: "Other plan details (price, interval, etc.) are, by design, not editable."
   */

  update: function *(next) {
    this.accepts('application/json');
    try {
      var stripePlan = yield updateStripePlan(this.params.plan, this.request.body);

      this.body = yield updatePlan(stripePlan);
    } catch (e) {
      handleError.call(this, e);
    }
  },

  destroy: function *(next) {
    try {
      var stripeId = this.params.plan;

      deletePlan(stripeId);

      this.body = yield deleteStripePlan(stripeId);
    } catch (e) {
      handleError.call(this, e);
    }
  }
};

function *retrieveStripePlan(id) {
  return yield stripe.plans.retrieve(id);
}

function *createStripePlan(body) {
  return yield stripe.plans.create(body);
}

function *updateStripePlan(id, body) {
  return yield stripe.plans.update(id, body);
}

function *deleteStripePlan(id) {
  return yield stripe.plans.del(id);
}

function *getPlans(product) {
  return yield Plan.find({ product_id: product }).exec();
}

function *savePlan(stripePlan, product) {
  return yield Plan.create({
    name: stripePlan.name,
    product_id: product,
    stripe_id: stripePlan.id
  });
}

function *updatePlan(stripePlan) {
  return yield Plan.update(
    {
      stripe_id: stripePlan.id
    },

    {
      name: stripePlan.name
    }
  ).exec();
}

function deletePlan(id) {
  Plan.find({ stripe_id: id }).remove().exec();
}
