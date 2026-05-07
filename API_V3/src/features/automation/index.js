const routes = require('./routes');

module.exports = {
  routes,
  models: {
    Automation: require('./models/Automation'),
    QAFlow: require('./models/QAFlow')
  },
  services: {
    N8nService: require('./services/N8nService')
  },
  controllers: {
    automationController: require('./controllers/automationController'),
    qaFlowController: require('./controllers/qaFlowController')
  }
}; 