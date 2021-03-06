System.register(['aurelia-dependency-injection', 'aurelia-event-aggregator', 'aurelia-logging'], function (_export) {

	'use strict';

	var inject, EventAggregator, LogManager, defaultOptions, criteria, delegate, Analytics;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	return {
		setters: [function (_aureliaDependencyInjection) {
			inject = _aureliaDependencyInjection.inject;
		}, function (_aureliaEventAggregator) {
			EventAggregator = _aureliaEventAggregator.EventAggregator;
		}, function (_aureliaLogging) {
			LogManager = _aureliaLogging;
		}],
		execute: function () {
			defaultOptions = {
				logging: {
					enabled: true
				},
				pageTracking: {
					enabled: false
				},
				clickTracking: {
					enabled: false
				}
			};
			criteria = {
				isElement: function isElement(e) {
					return e instanceof HTMLElement;
				},
				hasClass: function hasClass(cls) {
					return function (e) {
						return criteria.isElement(e) && e.classList.contains(cls);
					};
				},
				hasTrackingInfo: function hasTrackingInfo(e) {
					return criteria.isElement(e) && e.hasAttribute('data-analytics-category') && e.hasAttribute('data-analytics-action');
				},
				isOfType: function isOfType(e, type) {
					return criteria.isElement(e) && e.nodeName.toLowerCase() === type.toLowerCase();
				},
				isAnchor: function isAnchor(e) {
					return criteria.isOfType(e, 'a');
				},
				isButton: function isButton(e) {
					return criteria.isOfType(e, 'button');
				}
			};

			delegate = function delegate(criteria, listener) {
				return function (evt) {
					var el = evt.target;
					do {
						if (!criteria(el)) continue;
						evt.delegateTarget = el;
						listener.apply(this, arguments);
						return;
					} while (el = el.parentNode);
				};
			};

			Analytics = (function () {
				function Analytics(eventAggregator) {
					_classCallCheck(this, _Analytics);

					this._eventAggregator = eventAggregator;
					this._initialized = false;
					this._logger = LogManager.getLogger('analytics-plugin');
					this._options = defaultOptions;

					this._trackClick = this._trackClick.bind(this);
					this._trackPage = this._trackPage.bind(this);
				}

				_createClass(Analytics, [{
					key: 'attach',
					value: function attach() {
						var options = arguments.length <= 0 || arguments[0] === undefined ? defaultOptions : arguments[0];

						this._options = Object.assign({}, defaultOptions, options);
						if (!this._initialized) {
							var errorMessage = "Analytics must be initialized before use.";
							this._log('error', errorMessage);
							throw new Error(errorMessage);
						}

						this._attachClickTracker();
						this._attachPageTracker();
					}
				}, {
					key: 'init',
					value: function init(id) {
						var script = document.createElement('script');
						script.text = "(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){" + "(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o)," + "m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)" + "})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');";
						document.querySelector('body').appendChild(script);

						window.ga = window.ga || function () {
							(ga.q = ga.q || []).push(arguments);
						};ga.l = +new Date();
						ga('create', id, 'auto');
						ga('send', 'pageview');

						this._initialized = true;
					}
				}, {
					key: '_attachClickTracker',
					value: function _attachClickTracker() {
						if (!this._options.clickTracking.enabled) {
							return;
						}

						document.querySelector('body').addEventListener('click', delegate(this._options.clickTracking.filter, this._trackClick));
					}
				}, {
					key: '_attachPageTracker',
					value: function _attachPageTracker() {
						var _this = this;

						if (!this._options.pageTracking.enabled) {
							return;
						}

						this._eventAggregator.subscribe('router:navigation:success', function (payload) {
							return _this._trackPage(payload.instruction.fragment, payload.instruction.config.title);
						});
					}
				}, {
					key: '_log',
					value: function _log(level, message) {
						if (!this._options.logging.enabled) {
							return;
						}

						this._logger[level](message);
					}
				}, {
					key: '_trackClick',
					value: function _trackClick(evt) {
						if (!this._initialized) {
							this._log('warn', "The component has not been initialized. Please call 'init()' before calling 'attach()'.");
							return;
						}
						if (!evt || !evt.delegateTarget || !criteria.hasTrackingInfo(evt.delegateTarget)) {
							return;
						};

						var element = evt.delegateTarget;
						var tracking = {
							category: element.getAttribute('data-analytics-category'),
							action: element.getAttribute('data-analytics-action'),
							label: element.getAttribute('data-analytics-label')
						};

						this._log('debug', 'click: category \'' + tracking.category + '\', action \'' + tracking.action + '\', label \'' + tracking.label + '\'');
						ga('send', 'event', tracking.category, tracking.action, tracking.label);
					}
				}, {
					key: '_trackPage',
					value: function _trackPage(path, title) {
						this._log('debug', 'Tracking path = ' + path + ', title = ' + title);
						if (!this._initialized) {
							this._log('warn', "Try calling 'init()' before calling 'attach()'.");
							return;
						}

						ga('set', { page: path, title: title });
						ga('send', 'pageview');
					}
				}]);

				var _Analytics = Analytics;
				Analytics = inject(EventAggregator)(Analytics) || Analytics;
				return Analytics;
			})();

			_export('Analytics', Analytics);
		}
	};
});