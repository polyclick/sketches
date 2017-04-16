"bundle";
System.registerDynamic("npm:gsap@1.18.0.json", [], true, function() {
  return {
    "main": "src/uncompressed/TweenMax.js",
    "format": "cjs",
    "meta": {
      "*.json": {
        "format": "json"
      }
    }
  };
});

System.registerDynamic("npm:gsap@1.18.0/src/uncompressed/TweenMax.js", [], true, function ($__require, exports, module) {
	var global = this || self,
	    GLOBAL = global;
	/*!
  * VERSION: 1.18.0
  * DATE: 2015-09-05
  * UPDATES AND DOCS AT: http://greensock.com
  * 
  * Includes all of the following: TweenLite, TweenMax, TimelineLite, TimelineMax, EasePack, CSSPlugin, RoundPropsPlugin, BezierPlugin, AttrPlugin, DirectionalRotationPlugin
  *
  * @license Copyright (c) 2008-2015, GreenSock. All rights reserved.
  * This work is subject to the terms at http://greensock.com/standard-license or for
  * Club GreenSock members, the software agreement that was issued with your membership.
  * 
  * @author: Jack Doyle, jack@greensock.com
  **/
	var _gsScope = typeof module !== "undefined" && module.exports && typeof global !== "undefined" ? global : exports || window; //helps ensure compatibility with AMD/RequireJS and CommonJS/Node
	(_gsScope._gsQueue || (_gsScope._gsQueue = [])).push(function () {

		"use strict";

		_gsScope._gsDefine("TweenMax", ["core.Animation", "core.SimpleTimeline", "TweenLite"], function (Animation, SimpleTimeline, TweenLite) {

			var _slice = function (a) {
				//don't use [].slice because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
				var b = [],
				    l = a.length,
				    i;
				for (i = 0; i !== l; b.push(a[i++]));
				return b;
			},
			    _applyCycle = function (vars, targets, i) {
				var alt = vars.cycle,
				    p,
				    val;
				for (p in alt) {
					val = alt[p];
					vars[p] = typeof val === "function" ? val.call(targets[i], i) : val[i % val.length];
				}
				delete vars.cycle;
			},
			    TweenMax = function (target, duration, vars) {
				TweenLite.call(this, target, duration, vars);
				this._cycle = 0;
				this._yoyo = this.vars.yoyo === true;
				this._repeat = this.vars.repeat || 0;
				this._repeatDelay = this.vars.repeatDelay || 0;
				this._dirty = true; //ensures that if there is any repeat, the totalDuration will get recalculated to accurately report it.
				this.render = TweenMax.prototype.render; //speed optimization (avoid prototype lookup on this "hot" method)
			},
			    _tinyNum = 0.0000000001,
			    TweenLiteInternals = TweenLite._internals,
			    _isSelector = TweenLiteInternals.isSelector,
			    _isArray = TweenLiteInternals.isArray,
			    p = TweenMax.prototype = TweenLite.to({}, 0.1, {}),
			    _blankArray = [];

			TweenMax.version = "1.18.0";
			p.constructor = TweenMax;
			p.kill()._gc = false;
			TweenMax.killTweensOf = TweenMax.killDelayedCallsTo = TweenLite.killTweensOf;
			TweenMax.getTweensOf = TweenLite.getTweensOf;
			TweenMax.lagSmoothing = TweenLite.lagSmoothing;
			TweenMax.ticker = TweenLite.ticker;
			TweenMax.render = TweenLite.render;

			p.invalidate = function () {
				this._yoyo = this.vars.yoyo === true;
				this._repeat = this.vars.repeat || 0;
				this._repeatDelay = this.vars.repeatDelay || 0;
				this._uncache(true);
				return TweenLite.prototype.invalidate.call(this);
			};

			p.updateTo = function (vars, resetDuration) {
				var curRatio = this.ratio,
				    immediate = this.vars.immediateRender || vars.immediateRender,
				    p;
				if (resetDuration && this._startTime < this._timeline._time) {
					this._startTime = this._timeline._time;
					this._uncache(false);
					if (this._gc) {
						this._enabled(true, false);
					} else {
						this._timeline.insert(this, this._startTime - this._delay); //ensures that any necessary re-sequencing of Animations in the timeline occurs to make sure the rendering order is correct.
					}
				}
				for (p in vars) {
					this.vars[p] = vars[p];
				}
				if (this._initted || immediate) {
					if (resetDuration) {
						this._initted = false;
						if (immediate) {
							this.render(0, true, true);
						}
					} else {
						if (this._gc) {
							this._enabled(true, false);
						}
						if (this._notifyPluginsOfEnabled && this._firstPT) {
							TweenLite._onPluginEvent("_onDisable", this); //in case a plugin like MotionBlur must perform some cleanup tasks
						}
						if (this._time / this._duration > 0.998) {
							//if the tween has finished (or come extremely close to finishing), we just need to rewind it to 0 and then render it again at the end which forces it to re-initialize (parsing the new vars). We allow tweens that are close to finishing (but haven't quite finished) to work this way too because otherwise, the values are so small when determining where to project the starting values that binary math issues creep in and can make the tween appear to render incorrectly when run backwards. 
							var prevTime = this._time;
							this.render(0, true, false);
							this._initted = false;
							this.render(prevTime, true, false);
						} else if (this._time > 0 || immediate) {
							this._initted = false;
							this._init();
							var inv = 1 / (1 - curRatio),
							    pt = this._firstPT,
							    endValue;
							while (pt) {
								endValue = pt.s + pt.c;
								pt.c *= inv;
								pt.s = endValue - pt.c;
								pt = pt._next;
							}
						}
					}
				}
				return this;
			};

			p.render = function (time, suppressEvents, force) {
				if (!this._initted) if (this._duration === 0 && this.vars.repeat) {
					//zero duration tweens that render immediately have render() called from TweenLite's constructor, before TweenMax's constructor has finished setting _repeat, _repeatDelay, and _yoyo which are critical in determining totalDuration() so we need to call invalidate() which is a low-kb way to get those set properly.
					this.invalidate();
				}
				var totalDur = !this._dirty ? this._totalDuration : this.totalDuration(),
				    prevTime = this._time,
				    prevTotalTime = this._totalTime,
				    prevCycle = this._cycle,
				    duration = this._duration,
				    prevRawPrevTime = this._rawPrevTime,
				    isComplete,
				    callback,
				    pt,
				    cycleDuration,
				    r,
				    type,
				    pow,
				    rawPrevTime;
				if (time >= totalDur) {
					this._totalTime = totalDur;
					this._cycle = this._repeat;
					if (this._yoyo && (this._cycle & 1) !== 0) {
						this._time = 0;
						this.ratio = this._ease._calcEnd ? this._ease.getRatio(0) : 0;
					} else {
						this._time = duration;
						this.ratio = this._ease._calcEnd ? this._ease.getRatio(1) : 1;
					}
					if (!this._reversed) {
						isComplete = true;
						callback = "onComplete";
						force = force || this._timeline.autoRemoveChildren; //otherwise, if the animation is unpaused/activated after it's already finished, it doesn't get removed from the parent timeline.
					}
					if (duration === 0) if (this._initted || !this.vars.lazy || force) {
						//zero-duration tweens are tricky because we must discern the momentum/direction of time in order to determine whether the starting values should be rendered or the ending values. If the "playhead" of its timeline goes past the zero-duration tween in the forward direction or lands directly on it, the end values should be rendered, but if the timeline's "playhead" moves past it in the backward direction (from a postitive time to a negative time), the starting values must be rendered.
						if (this._startTime === this._timeline._duration) {
							//if a zero-duration tween is at the VERY end of a timeline and that timeline renders at its end, it will typically add a tiny bit of cushion to the render time to prevent rounding errors from getting in the way of tweens rendering their VERY end. If we then reverse() that timeline, the zero-duration tween will trigger its onReverseComplete even though technically the playhead didn't pass over it again. It's a very specific edge case we must accommodate.
							time = 0;
						}
						if (time === 0 || prevRawPrevTime < 0 || prevRawPrevTime === _tinyNum) if (prevRawPrevTime !== time) {
							force = true;
							if (prevRawPrevTime > _tinyNum) {
								callback = "onReverseComplete";
							}
						}
						this._rawPrevTime = rawPrevTime = !suppressEvents || time || prevRawPrevTime === time ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
					}
				} else if (time < 0.0000001) {
					//to work around occasional floating point math artifacts, round super small values to 0.
					this._totalTime = this._time = this._cycle = 0;
					this.ratio = this._ease._calcEnd ? this._ease.getRatio(0) : 0;
					if (prevTotalTime !== 0 || duration === 0 && prevRawPrevTime > 0) {
						callback = "onReverseComplete";
						isComplete = this._reversed;
					}
					if (time < 0) {
						this._active = false;
						if (duration === 0) if (this._initted || !this.vars.lazy || force) {
							//zero-duration tweens are tricky because we must discern the momentum/direction of time in order to determine whether the starting values should be rendered or the ending values. If the "playhead" of its timeline goes past the zero-duration tween in the forward direction or lands directly on it, the end values should be rendered, but if the timeline's "playhead" moves past it in the backward direction (from a postitive time to a negative time), the starting values must be rendered.
							if (prevRawPrevTime >= 0) {
								force = true;
							}
							this._rawPrevTime = rawPrevTime = !suppressEvents || time || prevRawPrevTime === time ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
						}
					}
					if (!this._initted) {
						//if we render the very beginning (time == 0) of a fromTo(), we must force the render (normal tweens wouldn't need to render at a time of 0 when the prevTime was also 0). This is also mandatory to make sure overwriting kicks in immediately.
						force = true;
					}
				} else {
					this._totalTime = this._time = time;

					if (this._repeat !== 0) {
						cycleDuration = duration + this._repeatDelay;
						this._cycle = this._totalTime / cycleDuration >> 0; //originally _totalTime % cycleDuration but floating point errors caused problems, so I normalized it. (4 % 0.8 should be 0 but Flash reports it as 0.79999999!)
						if (this._cycle !== 0) if (this._cycle === this._totalTime / cycleDuration) {
							this._cycle--; //otherwise when rendered exactly at the end time, it will act as though it is repeating (at the beginning)
						}
						this._time = this._totalTime - this._cycle * cycleDuration;
						if (this._yoyo) if ((this._cycle & 1) !== 0) {
							this._time = duration - this._time;
						}
						if (this._time > duration) {
							this._time = duration;
						} else if (this._time < 0) {
							this._time = 0;
						}
					}

					if (this._easeType) {
						r = this._time / duration;
						type = this._easeType;
						pow = this._easePower;
						if (type === 1 || type === 3 && r >= 0.5) {
							r = 1 - r;
						}
						if (type === 3) {
							r *= 2;
						}
						if (pow === 1) {
							r *= r;
						} else if (pow === 2) {
							r *= r * r;
						} else if (pow === 3) {
							r *= r * r * r;
						} else if (pow === 4) {
							r *= r * r * r * r;
						}

						if (type === 1) {
							this.ratio = 1 - r;
						} else if (type === 2) {
							this.ratio = r;
						} else if (this._time / duration < 0.5) {
							this.ratio = r / 2;
						} else {
							this.ratio = 1 - r / 2;
						}
					} else {
						this.ratio = this._ease.getRatio(this._time / duration);
					}
				}

				if (prevTime === this._time && !force && prevCycle === this._cycle) {
					if (prevTotalTime !== this._totalTime) if (this._onUpdate) if (!suppressEvents) {
						//so that onUpdate fires even during the repeatDelay - as long as the totalTime changed, we should trigger onUpdate.
						this._callback("onUpdate");
					}
					return;
				} else if (!this._initted) {
					this._init();
					if (!this._initted || this._gc) {
						//immediateRender tweens typically won't initialize until the playhead advances (_time is greater than 0) in order to ensure that overwriting occurs properly. Also, if all of the tweening properties have been overwritten (which would cause _gc to be true, as set in _init()), we shouldn't continue otherwise an onStart callback could be called for example.
						return;
					} else if (!force && this._firstPT && (this.vars.lazy !== false && this._duration || this.vars.lazy && !this._duration)) {
						//we stick it in the queue for rendering at the very end of the tick - this is a performance optimization because browsers invalidate styles and force a recalculation if you read, write, and then read style data (so it's better to read/read/read/write/write/write than read/write/read/write/read/write). The down side, of course, is that usually you WANT things to render immediately because you may have code running right after that which depends on the change. Like imagine running TweenLite.set(...) and then immediately after that, creating a nother tween that animates the same property to another value; the starting values of that 2nd tween wouldn't be accurate if lazy is true.
						this._time = prevTime;
						this._totalTime = prevTotalTime;
						this._rawPrevTime = prevRawPrevTime;
						this._cycle = prevCycle;
						TweenLiteInternals.lazyTweens.push(this);
						this._lazy = [time, suppressEvents];
						return;
					}
					//_ease is initially set to defaultEase, so now that init() has run, _ease is set properly and we need to recalculate the ratio. Overall this is faster than using conditional logic earlier in the method to avoid having to set ratio twice because we only init() once but renderTime() gets called VERY frequently.
					if (this._time && !isComplete) {
						this.ratio = this._ease.getRatio(this._time / duration);
					} else if (isComplete && this._ease._calcEnd) {
						this.ratio = this._ease.getRatio(this._time === 0 ? 0 : 1);
					}
				}
				if (this._lazy !== false) {
					this._lazy = false;
				}

				if (!this._active) if (!this._paused && this._time !== prevTime && time >= 0) {
					this._active = true; //so that if the user renders a tween (as opposed to the timeline rendering it), the timeline is forced to re-render and align it with the proper time/frame on the next rendering cycle. Maybe the tween already finished but the user manually re-renders it as halfway done.
				}
				if (prevTotalTime === 0) {
					if (this._initted === 2 && time > 0) {
						//this.invalidate();
						this._init(); //will just apply overwriting since _initted of (2) means it was a from() tween that had immediateRender:true
					}
					if (this._startAt) {
						if (time >= 0) {
							this._startAt.render(time, suppressEvents, force);
						} else if (!callback) {
							callback = "_dummyGS"; //if no callback is defined, use a dummy value just so that the condition at the end evaluates as true because _startAt should render AFTER the normal render loop when the time is negative. We could handle this in a more intuitive way, of course, but the render loop is the MOST important thing to optimize, so this technique allows us to avoid adding extra conditional logic in a high-frequency area.
						}
					}
					if (this.vars.onStart) if (this._totalTime !== 0 || duration === 0) if (!suppressEvents) {
						this._callback("onStart");
					}
				}

				pt = this._firstPT;
				while (pt) {
					if (pt.f) {
						pt.t[pt.p](pt.c * this.ratio + pt.s);
					} else {
						pt.t[pt.p] = pt.c * this.ratio + pt.s;
					}
					pt = pt._next;
				}

				if (this._onUpdate) {
					if (time < 0) if (this._startAt && this._startTime) {
						//if the tween is positioned at the VERY beginning (_startTime 0) of its parent timeline, it's illegal for the playhead to go back further, so we should not render the recorded startAt values.
						this._startAt.render(time, suppressEvents, force); //note: for performance reasons, we tuck this conditional logic inside less traveled areas (most tweens don't have an onUpdate). We'd just have it at the end before the onComplete, but the values should be updated before any onUpdate is called, so we ALSO put it here and then if it's not called, we do so later near the onComplete.
					}
					if (!suppressEvents) if (this._totalTime !== prevTotalTime || isComplete) {
						this._callback("onUpdate");
					}
				}
				if (this._cycle !== prevCycle) if (!suppressEvents) if (!this._gc) if (this.vars.onRepeat) {
					this._callback("onRepeat");
				}
				if (callback) if (!this._gc || force) {
					//check gc because there's a chance that kill() could be called in an onUpdate
					if (time < 0 && this._startAt && !this._onUpdate && this._startTime) {
						//if the tween is positioned at the VERY beginning (_startTime 0) of its parent timeline, it's illegal for the playhead to go back further, so we should not render the recorded startAt values.
						this._startAt.render(time, suppressEvents, force);
					}
					if (isComplete) {
						if (this._timeline.autoRemoveChildren) {
							this._enabled(false, false);
						}
						this._active = false;
					}
					if (!suppressEvents && this.vars[callback]) {
						this._callback(callback);
					}
					if (duration === 0 && this._rawPrevTime === _tinyNum && rawPrevTime !== _tinyNum) {
						//the onComplete or onReverseComplete could trigger movement of the playhead and for zero-duration tweens (which must discern direction) that land directly back on their start time, we don't want to fire again on the next render. Think of several addPause()'s in a timeline that forces the playhead to a certain spot, but what if it's already paused and another tween is tweening the "time" of the timeline? Each time it moves [forward] past that spot, it would move back, and since suppressEvents is true, it'd reset _rawPrevTime to _tinyNum so that when it begins again, the callback would fire (so ultimately it could bounce back and forth during that tween). Again, this is a very uncommon scenario, but possible nonetheless.
						this._rawPrevTime = 0;
					}
				}
			};

			//---- STATIC FUNCTIONS -----------------------------------------------------------------------------------------------------------

			TweenMax.to = function (target, duration, vars) {
				return new TweenMax(target, duration, vars);
			};

			TweenMax.from = function (target, duration, vars) {
				vars.runBackwards = true;
				vars.immediateRender = vars.immediateRender != false;
				return new TweenMax(target, duration, vars);
			};

			TweenMax.fromTo = function (target, duration, fromVars, toVars) {
				toVars.startAt = fromVars;
				toVars.immediateRender = toVars.immediateRender != false && fromVars.immediateRender != false;
				return new TweenMax(target, duration, toVars);
			};

			TweenMax.staggerTo = TweenMax.allTo = function (targets, duration, vars, stagger, onCompleteAll, onCompleteAllParams, onCompleteAllScope) {
				stagger = stagger || 0;
				var delay = vars.delay || 0,
				    a = [],
				    finalComplete = function () {
					if (vars.onComplete) {
						vars.onComplete.apply(vars.onCompleteScope || this, arguments);
					}
					onCompleteAll.apply(onCompleteAllScope || vars.callbackScope || this, onCompleteAllParams || _blankArray);
				},
				    cycle = vars.cycle,
				    fromCycle = vars.startAt && vars.startAt.cycle,
				    l,
				    copy,
				    i,
				    p;
				if (!_isArray(targets)) {
					if (typeof targets === "string") {
						targets = TweenLite.selector(targets) || targets;
					}
					if (_isSelector(targets)) {
						targets = _slice(targets);
					}
				}
				targets = targets || [];
				if (stagger < 0) {
					targets = _slice(targets);
					targets.reverse();
					stagger *= -1;
				}
				l = targets.length - 1;
				for (i = 0; i <= l; i++) {
					copy = {};
					for (p in vars) {
						copy[p] = vars[p];
					}
					if (cycle) {
						_applyCycle(copy, targets, i);
					}
					if (fromCycle) {
						fromCycle = copy.startAt = {};
						for (p in vars.startAt) {
							fromCycle[p] = vars.startAt[p];
						}
						_applyCycle(copy.startAt, targets, i);
					}
					copy.delay = delay;
					if (i === l && onCompleteAll) {
						copy.onComplete = finalComplete;
					}
					a[i] = new TweenMax(targets[i], duration, copy);
					delay += stagger;
				}
				return a;
			};

			TweenMax.staggerFrom = TweenMax.allFrom = function (targets, duration, vars, stagger, onCompleteAll, onCompleteAllParams, onCompleteAllScope) {
				vars.runBackwards = true;
				vars.immediateRender = vars.immediateRender != false;
				return TweenMax.staggerTo(targets, duration, vars, stagger, onCompleteAll, onCompleteAllParams, onCompleteAllScope);
			};

			TweenMax.staggerFromTo = TweenMax.allFromTo = function (targets, duration, fromVars, toVars, stagger, onCompleteAll, onCompleteAllParams, onCompleteAllScope) {
				toVars.startAt = fromVars;
				toVars.immediateRender = toVars.immediateRender != false && fromVars.immediateRender != false;
				return TweenMax.staggerTo(targets, duration, toVars, stagger, onCompleteAll, onCompleteAllParams, onCompleteAllScope);
			};

			TweenMax.delayedCall = function (delay, callback, params, scope, useFrames) {
				return new TweenMax(callback, 0, { delay: delay, onComplete: callback, onCompleteParams: params, callbackScope: scope, onReverseComplete: callback, onReverseCompleteParams: params, immediateRender: false, useFrames: useFrames, overwrite: 0 });
			};

			TweenMax.set = function (target, vars) {
				return new TweenMax(target, 0, vars);
			};

			TweenMax.isTweening = function (target) {
				return TweenLite.getTweensOf(target, true).length > 0;
			};

			var _getChildrenOf = function (timeline, includeTimelines) {
				var a = [],
				    cnt = 0,
				    tween = timeline._first;
				while (tween) {
					if (tween instanceof TweenLite) {
						a[cnt++] = tween;
					} else {
						if (includeTimelines) {
							a[cnt++] = tween;
						}
						a = a.concat(_getChildrenOf(tween, includeTimelines));
						cnt = a.length;
					}
					tween = tween._next;
				}
				return a;
			},
			    getAllTweens = TweenMax.getAllTweens = function (includeTimelines) {
				return _getChildrenOf(Animation._rootTimeline, includeTimelines).concat(_getChildrenOf(Animation._rootFramesTimeline, includeTimelines));
			};

			TweenMax.killAll = function (complete, tweens, delayedCalls, timelines) {
				if (tweens == null) {
					tweens = true;
				}
				if (delayedCalls == null) {
					delayedCalls = true;
				}
				var a = getAllTweens(timelines != false),
				    l = a.length,
				    allTrue = tweens && delayedCalls && timelines,
				    isDC,
				    tween,
				    i;
				for (i = 0; i < l; i++) {
					tween = a[i];
					if (allTrue || tween instanceof SimpleTimeline || (isDC = tween.target === tween.vars.onComplete) && delayedCalls || tweens && !isDC) {
						if (complete) {
							tween.totalTime(tween._reversed ? 0 : tween.totalDuration());
						} else {
							tween._enabled(false, false);
						}
					}
				}
			};

			TweenMax.killChildTweensOf = function (parent, complete) {
				if (parent == null) {
					return;
				}
				var tl = TweenLiteInternals.tweenLookup,
				    a,
				    curParent,
				    p,
				    i,
				    l;
				if (typeof parent === "string") {
					parent = TweenLite.selector(parent) || parent;
				}
				if (_isSelector(parent)) {
					parent = _slice(parent);
				}
				if (_isArray(parent)) {
					i = parent.length;
					while (--i > -1) {
						TweenMax.killChildTweensOf(parent[i], complete);
					}
					return;
				}
				a = [];
				for (p in tl) {
					curParent = tl[p].target.parentNode;
					while (curParent) {
						if (curParent === parent) {
							a = a.concat(tl[p].tweens);
						}
						curParent = curParent.parentNode;
					}
				}
				l = a.length;
				for (i = 0; i < l; i++) {
					if (complete) {
						a[i].totalTime(a[i].totalDuration());
					}
					a[i]._enabled(false, false);
				}
			};

			var _changePause = function (pause, tweens, delayedCalls, timelines) {
				tweens = tweens !== false;
				delayedCalls = delayedCalls !== false;
				timelines = timelines !== false;
				var a = getAllTweens(timelines),
				    allTrue = tweens && delayedCalls && timelines,
				    i = a.length,
				    isDC,
				    tween;
				while (--i > -1) {
					tween = a[i];
					if (allTrue || tween instanceof SimpleTimeline || (isDC = tween.target === tween.vars.onComplete) && delayedCalls || tweens && !isDC) {
						tween.paused(pause);
					}
				}
			};

			TweenMax.pauseAll = function (tweens, delayedCalls, timelines) {
				_changePause(true, tweens, delayedCalls, timelines);
			};

			TweenMax.resumeAll = function (tweens, delayedCalls, timelines) {
				_changePause(false, tweens, delayedCalls, timelines);
			};

			TweenMax.globalTimeScale = function (value) {
				var tl = Animation._rootTimeline,
				    t = TweenLite.ticker.time;
				if (!arguments.length) {
					return tl._timeScale;
				}
				value = value || _tinyNum; //can't allow zero because it'll throw the math off
				tl._startTime = t - (t - tl._startTime) * tl._timeScale / value;
				tl = Animation._rootFramesTimeline;
				t = TweenLite.ticker.frame;
				tl._startTime = t - (t - tl._startTime) * tl._timeScale / value;
				tl._timeScale = Animation._rootTimeline._timeScale = value;
				return value;
			};

			//---- GETTERS / SETTERS ----------------------------------------------------------------------------------------------------------

			p.progress = function (value) {
				return !arguments.length ? this._time / this.duration() : this.totalTime(this.duration() * (this._yoyo && (this._cycle & 1) !== 0 ? 1 - value : value) + this._cycle * (this._duration + this._repeatDelay), false);
			};

			p.totalProgress = function (value) {
				return !arguments.length ? this._totalTime / this.totalDuration() : this.totalTime(this.totalDuration() * value, false);
			};

			p.time = function (value, suppressEvents) {
				if (!arguments.length) {
					return this._time;
				}
				if (this._dirty) {
					this.totalDuration();
				}
				if (value > this._duration) {
					value = this._duration;
				}
				if (this._yoyo && (this._cycle & 1) !== 0) {
					value = this._duration - value + this._cycle * (this._duration + this._repeatDelay);
				} else if (this._repeat !== 0) {
					value += this._cycle * (this._duration + this._repeatDelay);
				}
				return this.totalTime(value, suppressEvents);
			};

			p.duration = function (value) {
				if (!arguments.length) {
					return this._duration; //don't set _dirty = false because there could be repeats that haven't been factored into the _totalDuration yet. Otherwise, if you create a repeated TweenMax and then immediately check its duration(), it would cache the value and the totalDuration would not be correct, thus repeats wouldn't take effect.
				}
				return Animation.prototype.duration.call(this, value);
			};

			p.totalDuration = function (value) {
				if (!arguments.length) {
					if (this._dirty) {
						//instead of Infinity, we use 999999999999 so that we can accommodate reverses
						this._totalDuration = this._repeat === -1 ? 999999999999 : this._duration * (this._repeat + 1) + this._repeatDelay * this._repeat;
						this._dirty = false;
					}
					return this._totalDuration;
				}
				return this._repeat === -1 ? this : this.duration((value - this._repeat * this._repeatDelay) / (this._repeat + 1));
			};

			p.repeat = function (value) {
				if (!arguments.length) {
					return this._repeat;
				}
				this._repeat = value;
				return this._uncache(true);
			};

			p.repeatDelay = function (value) {
				if (!arguments.length) {
					return this._repeatDelay;
				}
				this._repeatDelay = value;
				return this._uncache(true);
			};

			p.yoyo = function (value) {
				if (!arguments.length) {
					return this._yoyo;
				}
				this._yoyo = value;
				return this;
			};

			return TweenMax;
		}, true);

		/*
   * ----------------------------------------------------------------
   * TimelineLite
   * ----------------------------------------------------------------
   */
		_gsScope._gsDefine("TimelineLite", ["core.Animation", "core.SimpleTimeline", "TweenLite"], function (Animation, SimpleTimeline, TweenLite) {

			var TimelineLite = function (vars) {
				SimpleTimeline.call(this, vars);
				this._labels = {};
				this.autoRemoveChildren = this.vars.autoRemoveChildren === true;
				this.smoothChildTiming = this.vars.smoothChildTiming === true;
				this._sortChildren = true;
				this._onUpdate = this.vars.onUpdate;
				var v = this.vars,
				    val,
				    p;
				for (p in v) {
					val = v[p];
					if (_isArray(val)) if (val.join("").indexOf("{self}") !== -1) {
						v[p] = this._swapSelfInParams(val);
					}
				}
				if (_isArray(v.tweens)) {
					this.add(v.tweens, 0, v.align, v.stagger);
				}
			},
			    _tinyNum = 0.0000000001,
			    TweenLiteInternals = TweenLite._internals,
			    _internals = TimelineLite._internals = {},
			    _isSelector = TweenLiteInternals.isSelector,
			    _isArray = TweenLiteInternals.isArray,
			    _lazyTweens = TweenLiteInternals.lazyTweens,
			    _lazyRender = TweenLiteInternals.lazyRender,
			    _globals = _gsScope._gsDefine.globals,
			    _copy = function (vars) {
				var copy = {},
				    p;
				for (p in vars) {
					copy[p] = vars[p];
				}
				return copy;
			},
			    _applyCycle = function (vars, targets, i) {
				var alt = vars.cycle,
				    p,
				    val;
				for (p in alt) {
					val = alt[p];
					vars[p] = typeof val === "function" ? val.call(targets[i], i) : val[i % val.length];
				}
				delete vars.cycle;
			},
			    _pauseCallback = _internals.pauseCallback = function () {},
			    _slice = function (a) {
				//don't use [].slice because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
				var b = [],
				    l = a.length,
				    i;
				for (i = 0; i !== l; b.push(a[i++]));
				return b;
			},
			    p = TimelineLite.prototype = new SimpleTimeline();

			TimelineLite.version = "1.18.0";
			p.constructor = TimelineLite;
			p.kill()._gc = p._forcingPlayhead = p._hasPause = false;

			/* might use later...
   //translates a local time inside an animation to the corresponding time on the root/global timeline, factoring in all nesting and timeScales.
   function localToGlobal(time, animation) {
   	while (animation) {
   		time = (time / animation._timeScale) + animation._startTime;
   		animation = animation.timeline;
   	}
   	return time;
   }
   	//translates the supplied time on the root/global timeline into the corresponding local time inside a particular animation, factoring in all nesting and timeScales
   function globalToLocal(time, animation) {
   	var scale = 1;
   	time -= localToGlobal(0, animation);
   	while (animation) {
   		scale *= animation._timeScale;
   		animation = animation.timeline;
   	}
   	return time * scale;
   }
   */

			p.to = function (target, duration, vars, position) {
				var Engine = vars.repeat && _globals.TweenMax || TweenLite;
				return duration ? this.add(new Engine(target, duration, vars), position) : this.set(target, vars, position);
			};

			p.from = function (target, duration, vars, position) {
				return this.add((vars.repeat && _globals.TweenMax || TweenLite).from(target, duration, vars), position);
			};

			p.fromTo = function (target, duration, fromVars, toVars, position) {
				var Engine = toVars.repeat && _globals.TweenMax || TweenLite;
				return duration ? this.add(Engine.fromTo(target, duration, fromVars, toVars), position) : this.set(target, toVars, position);
			};

			p.staggerTo = function (targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope) {
				var tl = new TimelineLite({ onComplete: onCompleteAll, onCompleteParams: onCompleteAllParams, callbackScope: onCompleteAllScope, smoothChildTiming: this.smoothChildTiming }),
				    cycle = vars.cycle,
				    copy,
				    i;
				if (typeof targets === "string") {
					targets = TweenLite.selector(targets) || targets;
				}
				targets = targets || [];
				if (_isSelector(targets)) {
					//senses if the targets object is a selector. If it is, we should translate it into an array.
					targets = _slice(targets);
				}
				stagger = stagger || 0;
				if (stagger < 0) {
					targets = _slice(targets);
					targets.reverse();
					stagger *= -1;
				}
				for (i = 0; i < targets.length; i++) {
					copy = _copy(vars);
					if (copy.startAt) {
						copy.startAt = _copy(copy.startAt);
						if (copy.startAt.cycle) {
							_applyCycle(copy.startAt, targets, i);
						}
					}
					if (cycle) {
						_applyCycle(copy, targets, i);
					}
					tl.to(targets[i], duration, copy, i * stagger);
				}
				return this.add(tl, position);
			};

			p.staggerFrom = function (targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope) {
				vars.immediateRender = vars.immediateRender != false;
				vars.runBackwards = true;
				return this.staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope);
			};

			p.staggerFromTo = function (targets, duration, fromVars, toVars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope) {
				toVars.startAt = fromVars;
				toVars.immediateRender = toVars.immediateRender != false && fromVars.immediateRender != false;
				return this.staggerTo(targets, duration, toVars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope);
			};

			p.call = function (callback, params, scope, position) {
				return this.add(TweenLite.delayedCall(0, callback, params, scope), position);
			};

			p.set = function (target, vars, position) {
				position = this._parseTimeOrLabel(position, 0, true);
				if (vars.immediateRender == null) {
					vars.immediateRender = position === this._time && !this._paused;
				}
				return this.add(new TweenLite(target, 0, vars), position);
			};

			TimelineLite.exportRoot = function (vars, ignoreDelayedCalls) {
				vars = vars || {};
				if (vars.smoothChildTiming == null) {
					vars.smoothChildTiming = true;
				}
				var tl = new TimelineLite(vars),
				    root = tl._timeline,
				    tween,
				    next;
				if (ignoreDelayedCalls == null) {
					ignoreDelayedCalls = true;
				}
				root._remove(tl, true);
				tl._startTime = 0;
				tl._rawPrevTime = tl._time = tl._totalTime = root._time;
				tween = root._first;
				while (tween) {
					next = tween._next;
					if (!ignoreDelayedCalls || !(tween instanceof TweenLite && tween.target === tween.vars.onComplete)) {
						tl.add(tween, tween._startTime - tween._delay);
					}
					tween = next;
				}
				root.add(tl, 0);
				return tl;
			};

			p.add = function (value, position, align, stagger) {
				var curTime, l, i, child, tl, beforeRawTime;
				if (typeof position !== "number") {
					position = this._parseTimeOrLabel(position, 0, true, value);
				}
				if (!(value instanceof Animation)) {
					if (value instanceof Array || value && value.push && _isArray(value)) {
						align = align || "normal";
						stagger = stagger || 0;
						curTime = position;
						l = value.length;
						for (i = 0; i < l; i++) {
							if (_isArray(child = value[i])) {
								child = new TimelineLite({ tweens: child });
							}
							this.add(child, curTime);
							if (typeof child !== "string" && typeof child !== "function") {
								if (align === "sequence") {
									curTime = child._startTime + child.totalDuration() / child._timeScale;
								} else if (align === "start") {
									child._startTime -= child.delay();
								}
							}
							curTime += stagger;
						}
						return this._uncache(true);
					} else if (typeof value === "string") {
						return this.addLabel(value, position);
					} else if (typeof value === "function") {
						value = TweenLite.delayedCall(0, value);
					} else {
						throw "Cannot add " + value + " into the timeline; it is not a tween, timeline, function, or string.";
					}
				}

				SimpleTimeline.prototype.add.call(this, value, position);

				//if the timeline has already ended but the inserted tween/timeline extends the duration, we should enable this timeline again so that it renders properly. We should also align the playhead with the parent timeline's when appropriate.
				if (this._gc || this._time === this._duration) if (!this._paused) if (this._duration < this.duration()) {
					//in case any of the ancestors had completed but should now be enabled...
					tl = this;
					beforeRawTime = tl.rawTime() > value._startTime; //if the tween is placed on the timeline so that it starts BEFORE the current rawTime, we should align the playhead (move the timeline). This is because sometimes users will create a timeline, let it finish, and much later append a tween and expect it to run instead of jumping to its end state. While technically one could argue that it should jump to its end state, that's not what users intuitively expect.
					while (tl._timeline) {
						if (beforeRawTime && tl._timeline.smoothChildTiming) {
							tl.totalTime(tl._totalTime, true); //moves the timeline (shifts its startTime) if necessary, and also enables it.
						} else if (tl._gc) {
							tl._enabled(true, false);
						}
						tl = tl._timeline;
					}
				}

				return this;
			};

			p.remove = function (value) {
				if (value instanceof Animation) {
					this._remove(value, false);
					var tl = value._timeline = value.vars.useFrames ? Animation._rootFramesTimeline : Animation._rootTimeline; //now that it's removed, default it to the root timeline so that if it gets played again, it doesn't jump back into this timeline.
					value._startTime = (value._paused ? value._pauseTime : tl._time) - (!value._reversed ? value._totalTime : value.totalDuration() - value._totalTime) / value._timeScale; //ensure that if it gets played again, the timing is correct.
					return this;
				} else if (value instanceof Array || value && value.push && _isArray(value)) {
					var i = value.length;
					while (--i > -1) {
						this.remove(value[i]);
					}
					return this;
				} else if (typeof value === "string") {
					return this.removeLabel(value);
				}
				return this.kill(null, value);
			};

			p._remove = function (tween, skipDisable) {
				SimpleTimeline.prototype._remove.call(this, tween, skipDisable);
				var last = this._last;
				if (!last) {
					this._time = this._totalTime = this._duration = this._totalDuration = 0;
				} else if (this._time > last._startTime + last._totalDuration / last._timeScale) {
					this._time = this.duration();
					this._totalTime = this._totalDuration;
				}
				return this;
			};

			p.append = function (value, offsetOrLabel) {
				return this.add(value, this._parseTimeOrLabel(null, offsetOrLabel, true, value));
			};

			p.insert = p.insertMultiple = function (value, position, align, stagger) {
				return this.add(value, position || 0, align, stagger);
			};

			p.appendMultiple = function (tweens, offsetOrLabel, align, stagger) {
				return this.add(tweens, this._parseTimeOrLabel(null, offsetOrLabel, true, tweens), align, stagger);
			};

			p.addLabel = function (label, position) {
				this._labels[label] = this._parseTimeOrLabel(position);
				return this;
			};

			p.addPause = function (position, callback, params, scope) {
				var t = TweenLite.delayedCall(0, _pauseCallback, params, scope || this);
				t.vars.onComplete = t.vars.onReverseComplete = callback;
				t.data = "isPause";
				this._hasPause = true;
				return this.add(t, position);
			};

			p.removeLabel = function (label) {
				delete this._labels[label];
				return this;
			};

			p.getLabelTime = function (label) {
				return this._labels[label] != null ? this._labels[label] : -1;
			};

			p._parseTimeOrLabel = function (timeOrLabel, offsetOrLabel, appendIfAbsent, ignore) {
				var i;
				//if we're about to add a tween/timeline (or an array of them) that's already a child of this timeline, we should remove it first so that it doesn't contaminate the duration().
				if (ignore instanceof Animation && ignore.timeline === this) {
					this.remove(ignore);
				} else if (ignore && (ignore instanceof Array || ignore.push && _isArray(ignore))) {
					i = ignore.length;
					while (--i > -1) {
						if (ignore[i] instanceof Animation && ignore[i].timeline === this) {
							this.remove(ignore[i]);
						}
					}
				}
				if (typeof offsetOrLabel === "string") {
					return this._parseTimeOrLabel(offsetOrLabel, appendIfAbsent && typeof timeOrLabel === "number" && this._labels[offsetOrLabel] == null ? timeOrLabel - this.duration() : 0, appendIfAbsent);
				}
				offsetOrLabel = offsetOrLabel || 0;
				if (typeof timeOrLabel === "string" && (isNaN(timeOrLabel) || this._labels[timeOrLabel] != null)) {
					//if the string is a number like "1", check to see if there's a label with that name, otherwise interpret it as a number (absolute value).
					i = timeOrLabel.indexOf("=");
					if (i === -1) {
						if (this._labels[timeOrLabel] == null) {
							return appendIfAbsent ? this._labels[timeOrLabel] = this.duration() + offsetOrLabel : offsetOrLabel;
						}
						return this._labels[timeOrLabel] + offsetOrLabel;
					}
					offsetOrLabel = parseInt(timeOrLabel.charAt(i - 1) + "1", 10) * Number(timeOrLabel.substr(i + 1));
					timeOrLabel = i > 1 ? this._parseTimeOrLabel(timeOrLabel.substr(0, i - 1), 0, appendIfAbsent) : this.duration();
				} else if (timeOrLabel == null) {
					timeOrLabel = this.duration();
				}
				return Number(timeOrLabel) + offsetOrLabel;
			};

			p.seek = function (position, suppressEvents) {
				return this.totalTime(typeof position === "number" ? position : this._parseTimeOrLabel(position), suppressEvents !== false);
			};

			p.stop = function () {
				return this.paused(true);
			};

			p.gotoAndPlay = function (position, suppressEvents) {
				return this.play(position, suppressEvents);
			};

			p.gotoAndStop = function (position, suppressEvents) {
				return this.pause(position, suppressEvents);
			};

			p.render = function (time, suppressEvents, force) {
				if (this._gc) {
					this._enabled(true, false);
				}
				var totalDur = !this._dirty ? this._totalDuration : this.totalDuration(),
				    prevTime = this._time,
				    prevStart = this._startTime,
				    prevTimeScale = this._timeScale,
				    prevPaused = this._paused,
				    tween,
				    isComplete,
				    next,
				    callback,
				    internalForce,
				    pauseTween;
				if (time >= totalDur) {
					this._totalTime = this._time = totalDur;
					if (!this._reversed) if (!this._hasPausedChild()) {
						isComplete = true;
						callback = "onComplete";
						internalForce = !!this._timeline.autoRemoveChildren; //otherwise, if the animation is unpaused/activated after it's already finished, it doesn't get removed from the parent timeline.
						if (this._duration === 0) if (time === 0 || this._rawPrevTime < 0 || this._rawPrevTime === _tinyNum) if (this._rawPrevTime !== time && this._first) {
							internalForce = true;
							if (this._rawPrevTime > _tinyNum) {
								callback = "onReverseComplete";
							}
						}
					}
					this._rawPrevTime = this._duration || !suppressEvents || time || this._rawPrevTime === time ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration timeline or tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
					time = totalDur + 0.0001; //to avoid occasional floating point rounding errors - sometimes child tweens/timelines were not being fully completed (their progress might be 0.999999999999998 instead of 1 because when _time - tween._startTime is performed, floating point errors would return a value that was SLIGHTLY off). Try (999999999999.7 - 999999999999) * 1 = 0.699951171875 instead of 0.7.
				} else if (time < 0.0000001) {
					//to work around occasional floating point math artifacts, round super small values to 0.
					this._totalTime = this._time = 0;
					if (prevTime !== 0 || this._duration === 0 && this._rawPrevTime !== _tinyNum && (this._rawPrevTime > 0 || time < 0 && this._rawPrevTime >= 0)) {
						callback = "onReverseComplete";
						isComplete = this._reversed;
					}
					if (time < 0) {
						this._active = false;
						if (this._timeline.autoRemoveChildren && this._reversed) {
							//ensures proper GC if a timeline is resumed after it's finished reversing.
							internalForce = isComplete = true;
							callback = "onReverseComplete";
						} else if (this._rawPrevTime >= 0 && this._first) {
							//when going back beyond the start, force a render so that zero-duration tweens that sit at the very beginning render their start values properly. Otherwise, if the parent timeline's playhead lands exactly at this timeline's startTime, and then moves backwards, the zero-duration tweens at the beginning would still be at their end state.
							internalForce = true;
						}
						this._rawPrevTime = time;
					} else {
						this._rawPrevTime = this._duration || !suppressEvents || time || this._rawPrevTime === time ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration timeline or tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
						if (time === 0 && isComplete) {
							//if there's a zero-duration tween at the very beginning of a timeline and the playhead lands EXACTLY at time 0, that tween will correctly render its end values, but we need to keep the timeline alive for one more render so that the beginning values render properly as the parent's playhead keeps moving beyond the begining. Imagine obj.x starts at 0 and then we do tl.set(obj, {x:100}).to(obj, 1, {x:200}) and then later we tl.reverse()...the goal is to have obj.x revert to 0. If the playhead happens to land on exactly 0, without this chunk of code, it'd complete the timeline and remove it from the rendering queue (not good).
							tween = this._first;
							while (tween && tween._startTime === 0) {
								if (!tween._duration) {
									isComplete = false;
								}
								tween = tween._next;
							}
						}
						time = 0; //to avoid occasional floating point rounding errors (could cause problems especially with zero-duration tweens at the very beginning of the timeline)
						if (!this._initted) {
							internalForce = true;
						}
					}
				} else {

					if (this._hasPause && !this._forcingPlayhead && !suppressEvents) {
						if (time >= prevTime) {
							tween = this._first;
							while (tween && tween._startTime <= time && !pauseTween) {
								if (!tween._duration) if (tween.data === "isPause" && !tween.ratio && !(tween._startTime === 0 && this._rawPrevTime === 0)) {
									pauseTween = tween;
								}
								tween = tween._next;
							}
						} else {
							tween = this._last;
							while (tween && tween._startTime >= time && !pauseTween) {
								if (!tween._duration) if (tween.data === "isPause" && tween._rawPrevTime > 0) {
									pauseTween = tween;
								}
								tween = tween._prev;
							}
						}
						if (pauseTween) {
							this._time = time = pauseTween._startTime;
							this._totalTime = time + this._cycle * (this._totalDuration + this._repeatDelay);
						}
					}

					this._totalTime = this._time = this._rawPrevTime = time;
				}
				if ((this._time === prevTime || !this._first) && !force && !internalForce && !pauseTween) {
					return;
				} else if (!this._initted) {
					this._initted = true;
				}

				if (!this._active) if (!this._paused && this._time !== prevTime && time > 0) {
					this._active = true; //so that if the user renders the timeline (as opposed to the parent timeline rendering it), it is forced to re-render and align it with the proper time/frame on the next rendering cycle. Maybe the timeline already finished but the user manually re-renders it as halfway done, for example.
				}

				if (prevTime === 0) if (this.vars.onStart) if (this._time !== 0) if (!suppressEvents) {
					this._callback("onStart");
				}

				if (this._time >= prevTime) {
					tween = this._first;
					while (tween) {
						next = tween._next; //record it here because the value could change after rendering...
						if (this._paused && !prevPaused) {
							//in case a tween pauses the timeline when rendering
							break;
						} else if (tween._active || tween._startTime <= this._time && !tween._paused && !tween._gc) {
							if (pauseTween === tween) {
								this.pause();
							}
							if (!tween._reversed) {
								tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
							} else {
								tween.render((!tween._dirty ? tween._totalDuration : tween.totalDuration()) - (time - tween._startTime) * tween._timeScale, suppressEvents, force);
							}
						}
						tween = next;
					}
				} else {
					tween = this._last;
					while (tween) {
						next = tween._prev; //record it here because the value could change after rendering...
						if (this._paused && !prevPaused) {
							//in case a tween pauses the timeline when rendering
							break;
						} else if (tween._active || tween._startTime <= prevTime && !tween._paused && !tween._gc) {
							if (pauseTween === tween) {
								pauseTween = tween._prev; //the linked list is organized by _startTime, thus it's possible that a tween could start BEFORE the pause and end after it, in which case it would be positioned before the pause tween in the linked list, but we should render it before we pause() the timeline and cease rendering. This is only a concern when going in reverse.
								while (pauseTween && pauseTween.endTime() > this._time) {
									pauseTween.render(pauseTween._reversed ? pauseTween.totalDuration() - (time - pauseTween._startTime) * pauseTween._timeScale : (time - pauseTween._startTime) * pauseTween._timeScale, suppressEvents, force);
									pauseTween = pauseTween._prev;
								}
								pauseTween = null;
								this.pause();
							}
							if (!tween._reversed) {
								tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
							} else {
								tween.render((!tween._dirty ? tween._totalDuration : tween.totalDuration()) - (time - tween._startTime) * tween._timeScale, suppressEvents, force);
							}
						}
						tween = next;
					}
				}

				if (this._onUpdate) if (!suppressEvents) {
					if (_lazyTweens.length) {
						//in case rendering caused any tweens to lazy-init, we should render them because typically when a timeline finishes, users expect things to have rendered fully. Imagine an onUpdate on a timeline that reports/checks tweened values.
						_lazyRender();
					}
					this._callback("onUpdate");
				}

				if (callback) if (!this._gc) if (prevStart === this._startTime || prevTimeScale !== this._timeScale) if (this._time === 0 || totalDur >= this.totalDuration()) {
					//if one of the tweens that was rendered altered this timeline's startTime (like if an onComplete reversed the timeline), it probably isn't complete. If it is, don't worry, because whatever call altered the startTime would complete if it was necessary at the new time. The only exception is the timeScale property. Also check _gc because there's a chance that kill() could be called in an onUpdate
					if (isComplete) {
						if (_lazyTweens.length) {
							//in case rendering caused any tweens to lazy-init, we should render them because typically when a timeline finishes, users expect things to have rendered fully. Imagine an onComplete on a timeline that reports/checks tweened values.
							_lazyRender();
						}
						if (this._timeline.autoRemoveChildren) {
							this._enabled(false, false);
						}
						this._active = false;
					}
					if (!suppressEvents && this.vars[callback]) {
						this._callback(callback);
					}
				}
			};

			p._hasPausedChild = function () {
				var tween = this._first;
				while (tween) {
					if (tween._paused || tween instanceof TimelineLite && tween._hasPausedChild()) {
						return true;
					}
					tween = tween._next;
				}
				return false;
			};

			p.getChildren = function (nested, tweens, timelines, ignoreBeforeTime) {
				ignoreBeforeTime = ignoreBeforeTime || -9999999999;
				var a = [],
				    tween = this._first,
				    cnt = 0;
				while (tween) {
					if (tween._startTime < ignoreBeforeTime) {
						//do nothing
					} else if (tween instanceof TweenLite) {
						if (tweens !== false) {
							a[cnt++] = tween;
						}
					} else {
						if (timelines !== false) {
							a[cnt++] = tween;
						}
						if (nested !== false) {
							a = a.concat(tween.getChildren(true, tweens, timelines));
							cnt = a.length;
						}
					}
					tween = tween._next;
				}
				return a;
			};

			p.getTweensOf = function (target, nested) {
				var disabled = this._gc,
				    a = [],
				    cnt = 0,
				    tweens,
				    i;
				if (disabled) {
					this._enabled(true, true); //getTweensOf() filters out disabled tweens, and we have to mark them as _gc = true when the timeline completes in order to allow clean garbage collection, so temporarily re-enable the timeline here.
				}
				tweens = TweenLite.getTweensOf(target);
				i = tweens.length;
				while (--i > -1) {
					if (tweens[i].timeline === this || nested && this._contains(tweens[i])) {
						a[cnt++] = tweens[i];
					}
				}
				if (disabled) {
					this._enabled(false, true);
				}
				return a;
			};

			p.recent = function () {
				return this._recent;
			};

			p._contains = function (tween) {
				var tl = tween.timeline;
				while (tl) {
					if (tl === this) {
						return true;
					}
					tl = tl.timeline;
				}
				return false;
			};

			p.shiftChildren = function (amount, adjustLabels, ignoreBeforeTime) {
				ignoreBeforeTime = ignoreBeforeTime || 0;
				var tween = this._first,
				    labels = this._labels,
				    p;
				while (tween) {
					if (tween._startTime >= ignoreBeforeTime) {
						tween._startTime += amount;
					}
					tween = tween._next;
				}
				if (adjustLabels) {
					for (p in labels) {
						if (labels[p] >= ignoreBeforeTime) {
							labels[p] += amount;
						}
					}
				}
				return this._uncache(true);
			};

			p._kill = function (vars, target) {
				if (!vars && !target) {
					return this._enabled(false, false);
				}
				var tweens = !target ? this.getChildren(true, true, false) : this.getTweensOf(target),
				    i = tweens.length,
				    changed = false;
				while (--i > -1) {
					if (tweens[i]._kill(vars, target)) {
						changed = true;
					}
				}
				return changed;
			};

			p.clear = function (labels) {
				var tweens = this.getChildren(false, true, true),
				    i = tweens.length;
				this._time = this._totalTime = 0;
				while (--i > -1) {
					tweens[i]._enabled(false, false);
				}
				if (labels !== false) {
					this._labels = {};
				}
				return this._uncache(true);
			};

			p.invalidate = function () {
				var tween = this._first;
				while (tween) {
					tween.invalidate();
					tween = tween._next;
				}
				return Animation.prototype.invalidate.call(this);;
			};

			p._enabled = function (enabled, ignoreTimeline) {
				if (enabled === this._gc) {
					var tween = this._first;
					while (tween) {
						tween._enabled(enabled, true);
						tween = tween._next;
					}
				}
				return SimpleTimeline.prototype._enabled.call(this, enabled, ignoreTimeline);
			};

			p.totalTime = function (time, suppressEvents, uncapped) {
				this._forcingPlayhead = true;
				var val = Animation.prototype.totalTime.apply(this, arguments);
				this._forcingPlayhead = false;
				return val;
			};

			p.duration = function (value) {
				if (!arguments.length) {
					if (this._dirty) {
						this.totalDuration(); //just triggers recalculation
					}
					return this._duration;
				}
				if (this.duration() !== 0 && value !== 0) {
					this.timeScale(this._duration / value);
				}
				return this;
			};

			p.totalDuration = function (value) {
				if (!arguments.length) {
					if (this._dirty) {
						var max = 0,
						    tween = this._last,
						    prevStart = 999999999999,
						    prev,
						    end;
						while (tween) {
							prev = tween._prev; //record it here in case the tween changes position in the sequence...
							if (tween._dirty) {
								tween.totalDuration(); //could change the tween._startTime, so make sure the tween's cache is clean before analyzing it.
							}
							if (tween._startTime > prevStart && this._sortChildren && !tween._paused) {
								//in case one of the tweens shifted out of order, it needs to be re-inserted into the correct position in the sequence
								this.add(tween, tween._startTime - tween._delay);
							} else {
								prevStart = tween._startTime;
							}
							if (tween._startTime < 0 && !tween._paused) {
								//children aren't allowed to have negative startTimes unless smoothChildTiming is true, so adjust here if one is found.
								max -= tween._startTime;
								if (this._timeline.smoothChildTiming) {
									this._startTime += tween._startTime / this._timeScale;
								}
								this.shiftChildren(-tween._startTime, false, -9999999999);
								prevStart = 0;
							}
							end = tween._startTime + tween._totalDuration / tween._timeScale;
							if (end > max) {
								max = end;
							}
							tween = prev;
						}
						this._duration = this._totalDuration = max;
						this._dirty = false;
					}
					return this._totalDuration;
				}
				if (this.totalDuration() !== 0) if (value !== 0) {
					this.timeScale(this._totalDuration / value);
				}
				return this;
			};

			p.paused = function (value) {
				if (!value) {
					//if there's a pause directly at the spot from where we're unpausing, skip it.
					var tween = this._first,
					    time = this._time;
					while (tween) {
						if (tween._startTime === time && tween.data === "isPause") {
							tween._rawPrevTime = 0; //remember, _rawPrevTime is how zero-duration tweens/callbacks sense directionality and determine whether or not to fire. If _rawPrevTime is the same as _startTime on the next render, it won't fire.
						}
						tween = tween._next;
					}
				}
				return Animation.prototype.paused.apply(this, arguments);
			};

			p.usesFrames = function () {
				var tl = this._timeline;
				while (tl._timeline) {
					tl = tl._timeline;
				}
				return tl === Animation._rootFramesTimeline;
			};

			p.rawTime = function () {
				return this._paused ? this._totalTime : (this._timeline.rawTime() - this._startTime) * this._timeScale;
			};

			return TimelineLite;
		}, true);

		/*
   * ----------------------------------------------------------------
   * TimelineMax
   * ----------------------------------------------------------------
   */
		_gsScope._gsDefine("TimelineMax", ["TimelineLite", "TweenLite", "easing.Ease"], function (TimelineLite, TweenLite, Ease) {

			var TimelineMax = function (vars) {
				TimelineLite.call(this, vars);
				this._repeat = this.vars.repeat || 0;
				this._repeatDelay = this.vars.repeatDelay || 0;
				this._cycle = 0;
				this._yoyo = this.vars.yoyo === true;
				this._dirty = true;
			},
			    _tinyNum = 0.0000000001,
			    TweenLiteInternals = TweenLite._internals,
			    _lazyTweens = TweenLiteInternals.lazyTweens,
			    _lazyRender = TweenLiteInternals.lazyRender,
			    _easeNone = new Ease(null, null, 1, 0),
			    p = TimelineMax.prototype = new TimelineLite();

			p.constructor = TimelineMax;
			p.kill()._gc = false;
			TimelineMax.version = "1.18.0";

			p.invalidate = function () {
				this._yoyo = this.vars.yoyo === true;
				this._repeat = this.vars.repeat || 0;
				this._repeatDelay = this.vars.repeatDelay || 0;
				this._uncache(true);
				return TimelineLite.prototype.invalidate.call(this);
			};

			p.addCallback = function (callback, position, params, scope) {
				return this.add(TweenLite.delayedCall(0, callback, params, scope), position);
			};

			p.removeCallback = function (callback, position) {
				if (callback) {
					if (position == null) {
						this._kill(null, callback);
					} else {
						var a = this.getTweensOf(callback, false),
						    i = a.length,
						    time = this._parseTimeOrLabel(position);
						while (--i > -1) {
							if (a[i]._startTime === time) {
								a[i]._enabled(false, false);
							}
						}
					}
				}
				return this;
			};

			p.removePause = function (position) {
				return this.removeCallback(TimelineLite._internals.pauseCallback, position);
			};

			p.tweenTo = function (position, vars) {
				vars = vars || {};
				var copy = { ease: _easeNone, useFrames: this.usesFrames(), immediateRender: false },
				    duration,
				    p,
				    t;
				for (p in vars) {
					copy[p] = vars[p];
				}
				copy.time = this._parseTimeOrLabel(position);
				duration = Math.abs(Number(copy.time) - this._time) / this._timeScale || 0.001;
				t = new TweenLite(this, duration, copy);
				copy.onStart = function () {
					t.target.paused(true);
					if (t.vars.time !== t.target.time() && duration === t.duration()) {
						//don't make the duration zero - if it's supposed to be zero, don't worry because it's already initting the tween and will complete immediately, effectively making the duration zero anyway. If we make duration zero, the tween won't run at all.
						t.duration(Math.abs(t.vars.time - t.target.time()) / t.target._timeScale);
					}
					if (vars.onStart) {
						//in case the user had an onStart in the vars - we don't want to overwrite it.
						t._callback("onStart");
					}
				};
				return t;
			};

			p.tweenFromTo = function (fromPosition, toPosition, vars) {
				vars = vars || {};
				fromPosition = this._parseTimeOrLabel(fromPosition);
				vars.startAt = { onComplete: this.seek, onCompleteParams: [fromPosition], callbackScope: this };
				vars.immediateRender = vars.immediateRender !== false;
				var t = this.tweenTo(toPosition, vars);
				return t.duration(Math.abs(t.vars.time - fromPosition) / this._timeScale || 0.001);
			};

			p.render = function (time, suppressEvents, force) {
				if (this._gc) {
					this._enabled(true, false);
				}
				var totalDur = !this._dirty ? this._totalDuration : this.totalDuration(),
				    dur = this._duration,
				    prevTime = this._time,
				    prevTotalTime = this._totalTime,
				    prevStart = this._startTime,
				    prevTimeScale = this._timeScale,
				    prevRawPrevTime = this._rawPrevTime,
				    prevPaused = this._paused,
				    prevCycle = this._cycle,
				    tween,
				    isComplete,
				    next,
				    callback,
				    internalForce,
				    cycleDuration,
				    pauseTween;
				if (time >= totalDur) {
					if (!this._locked) {
						this._totalTime = totalDur;
						this._cycle = this._repeat;
					}
					if (!this._reversed) if (!this._hasPausedChild()) {
						isComplete = true;
						callback = "onComplete";
						internalForce = !!this._timeline.autoRemoveChildren; //otherwise, if the animation is unpaused/activated after it's already finished, it doesn't get removed from the parent timeline.
						if (this._duration === 0) if (time === 0 || prevRawPrevTime < 0 || prevRawPrevTime === _tinyNum) if (prevRawPrevTime !== time && this._first) {
							internalForce = true;
							if (prevRawPrevTime > _tinyNum) {
								callback = "onReverseComplete";
							}
						}
					}
					this._rawPrevTime = this._duration || !suppressEvents || time || this._rawPrevTime === time ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration timeline or tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
					if (this._yoyo && (this._cycle & 1) !== 0) {
						this._time = time = 0;
					} else {
						this._time = dur;
						time = dur + 0.0001; //to avoid occasional floating point rounding errors - sometimes child tweens/timelines were not being fully completed (their progress might be 0.999999999999998 instead of 1 because when _time - tween._startTime is performed, floating point errors would return a value that was SLIGHTLY off). Try (999999999999.7 - 999999999999) * 1 = 0.699951171875 instead of 0.7. We cannot do less then 0.0001 because the same issue can occur when the duration is extremely large like 999999999999 in which case adding 0.00000001, for example, causes it to act like nothing was added.
					}
				} else if (time < 0.0000001) {
					//to work around occasional floating point math artifacts, round super small values to 0.
					if (!this._locked) {
						this._totalTime = this._cycle = 0;
					}
					this._time = 0;
					if (prevTime !== 0 || dur === 0 && prevRawPrevTime !== _tinyNum && (prevRawPrevTime > 0 || time < 0 && prevRawPrevTime >= 0) && !this._locked) {
						//edge case for checking time < 0 && prevRawPrevTime >= 0: a zero-duration fromTo() tween inside a zero-duration timeline (yeah, very rare)
						callback = "onReverseComplete";
						isComplete = this._reversed;
					}
					if (time < 0) {
						this._active = false;
						if (this._timeline.autoRemoveChildren && this._reversed) {
							internalForce = isComplete = true;
							callback = "onReverseComplete";
						} else if (prevRawPrevTime >= 0 && this._first) {
							//when going back beyond the start, force a render so that zero-duration tweens that sit at the very beginning render their start values properly. Otherwise, if the parent timeline's playhead lands exactly at this timeline's startTime, and then moves backwards, the zero-duration tweens at the beginning would still be at their end state.
							internalForce = true;
						}
						this._rawPrevTime = time;
					} else {
						this._rawPrevTime = dur || !suppressEvents || time || this._rawPrevTime === time ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration timeline or tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
						if (time === 0 && isComplete) {
							//if there's a zero-duration tween at the very beginning of a timeline and the playhead lands EXACTLY at time 0, that tween will correctly render its end values, but we need to keep the timeline alive for one more render so that the beginning values render properly as the parent's playhead keeps moving beyond the begining. Imagine obj.x starts at 0 and then we do tl.set(obj, {x:100}).to(obj, 1, {x:200}) and then later we tl.reverse()...the goal is to have obj.x revert to 0. If the playhead happens to land on exactly 0, without this chunk of code, it'd complete the timeline and remove it from the rendering queue (not good).
							tween = this._first;
							while (tween && tween._startTime === 0) {
								if (!tween._duration) {
									isComplete = false;
								}
								tween = tween._next;
							}
						}
						time = 0; //to avoid occasional floating point rounding errors (could cause problems especially with zero-duration tweens at the very beginning of the timeline)
						if (!this._initted) {
							internalForce = true;
						}
					}
				} else {
					if (dur === 0 && prevRawPrevTime < 0) {
						//without this, zero-duration repeating timelines (like with a simple callback nested at the very beginning and a repeatDelay) wouldn't render the first time through.
						internalForce = true;
					}
					this._time = this._rawPrevTime = time;
					if (!this._locked) {
						this._totalTime = time;
						if (this._repeat !== 0) {
							cycleDuration = dur + this._repeatDelay;
							this._cycle = this._totalTime / cycleDuration >> 0; //originally _totalTime % cycleDuration but floating point errors caused problems, so I normalized it. (4 % 0.8 should be 0 but it gets reported as 0.79999999!)
							if (this._cycle !== 0) if (this._cycle === this._totalTime / cycleDuration) {
								this._cycle--; //otherwise when rendered exactly at the end time, it will act as though it is repeating (at the beginning)
							}
							this._time = this._totalTime - this._cycle * cycleDuration;
							if (this._yoyo) if ((this._cycle & 1) !== 0) {
								this._time = dur - this._time;
							}
							if (this._time > dur) {
								this._time = dur;
								time = dur + 0.0001; //to avoid occasional floating point rounding error
							} else if (this._time < 0) {
								this._time = time = 0;
							} else {
								time = this._time;
							}
						}
					}

					if (this._hasPause && !this._forcingPlayhead && !suppressEvents) {
						time = this._time;
						if (time >= prevTime) {
							tween = this._first;
							while (tween && tween._startTime <= time && !pauseTween) {
								if (!tween._duration) if (tween.data === "isPause" && !tween.ratio && !(tween._startTime === 0 && this._rawPrevTime === 0)) {
									pauseTween = tween;
								}
								tween = tween._next;
							}
						} else {
							tween = this._last;
							while (tween && tween._startTime >= time && !pauseTween) {
								if (!tween._duration) if (tween.data === "isPause" && tween._rawPrevTime > 0) {
									pauseTween = tween;
								}
								tween = tween._prev;
							}
						}
						if (pauseTween) {
							this._time = time = pauseTween._startTime;
							this._totalTime = time + this._cycle * (this._totalDuration + this._repeatDelay);
						}
					}
				}

				if (this._cycle !== prevCycle) if (!this._locked) {
					/*
     make sure children at the end/beginning of the timeline are rendered properly. If, for example,
     a 3-second long timeline rendered at 2.9 seconds previously, and now renders at 3.2 seconds (which
     would get transated to 2.8 seconds if the timeline yoyos or 0.2 seconds if it just repeats), there
     could be a callback or a short tween that's at 2.95 or 3 seconds in which wouldn't render. So
     we need to push the timeline to the end (and/or beginning depending on its yoyo value). Also we must
     ensure that zero-duration tweens at the very beginning or end of the TimelineMax work.
     */
					var backwards = this._yoyo && (prevCycle & 1) !== 0,
					    wrap = backwards === (this._yoyo && (this._cycle & 1) !== 0),
					    recTotalTime = this._totalTime,
					    recCycle = this._cycle,
					    recRawPrevTime = this._rawPrevTime,
					    recTime = this._time;

					this._totalTime = prevCycle * dur;
					if (this._cycle < prevCycle) {
						backwards = !backwards;
					} else {
						this._totalTime += dur;
					}
					this._time = prevTime; //temporarily revert _time so that render() renders the children in the correct order. Without this, tweens won't rewind correctly. We could arhictect things in a "cleaner" way by splitting out the rendering queue into a separate method but for performance reasons, we kept it all inside this method.

					this._rawPrevTime = dur === 0 ? prevRawPrevTime - 0.0001 : prevRawPrevTime;
					this._cycle = prevCycle;
					this._locked = true; //prevents changes to totalTime and skips repeat/yoyo behavior when we recursively call render()
					prevTime = backwards ? 0 : dur;
					this.render(prevTime, suppressEvents, dur === 0);
					if (!suppressEvents) if (!this._gc) {
						if (this.vars.onRepeat) {
							this._callback("onRepeat");
						}
					}
					if (wrap) {
						prevTime = backwards ? dur + 0.0001 : -0.0001;
						this.render(prevTime, true, false);
					}
					this._locked = false;
					if (this._paused && !prevPaused) {
						//if the render() triggered callback that paused this timeline, we should abort (very rare, but possible)
						return;
					}
					this._time = recTime;
					this._totalTime = recTotalTime;
					this._cycle = recCycle;
					this._rawPrevTime = recRawPrevTime;
				}

				if ((this._time === prevTime || !this._first) && !force && !internalForce && !pauseTween) {
					if (prevTotalTime !== this._totalTime) if (this._onUpdate) if (!suppressEvents) {
						//so that onUpdate fires even during the repeatDelay - as long as the totalTime changed, we should trigger onUpdate.
						this._callback("onUpdate");
					}
					return;
				} else if (!this._initted) {
					this._initted = true;
				}

				if (!this._active) if (!this._paused && this._totalTime !== prevTotalTime && time > 0) {
					this._active = true; //so that if the user renders the timeline (as opposed to the parent timeline rendering it), it is forced to re-render and align it with the proper time/frame on the next rendering cycle. Maybe the timeline already finished but the user manually re-renders it as halfway done, for example.
				}

				if (prevTotalTime === 0) if (this.vars.onStart) if (this._totalTime !== 0) if (!suppressEvents) {
					this._callback("onStart");
				}

				if (this._time >= prevTime) {
					tween = this._first;
					while (tween) {
						next = tween._next; //record it here because the value could change after rendering...
						if (this._paused && !prevPaused) {
							//in case a tween pauses the timeline when rendering
							break;
						} else if (tween._active || tween._startTime <= this._time && !tween._paused && !tween._gc) {
							if (pauseTween === tween) {
								this.pause();
							}
							if (!tween._reversed) {
								tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
							} else {
								tween.render((!tween._dirty ? tween._totalDuration : tween.totalDuration()) - (time - tween._startTime) * tween._timeScale, suppressEvents, force);
							}
						}
						tween = next;
					}
				} else {
					tween = this._last;
					while (tween) {
						next = tween._prev; //record it here because the value could change after rendering...
						if (this._paused && !prevPaused) {
							//in case a tween pauses the timeline when rendering
							break;
						} else if (tween._active || tween._startTime <= prevTime && !tween._paused && !tween._gc) {
							if (pauseTween === tween) {
								pauseTween = tween._prev; //the linked list is organized by _startTime, thus it's possible that a tween could start BEFORE the pause and end after it, in which case it would be positioned before the pause tween in the linked list, but we should render it before we pause() the timeline and cease rendering. This is only a concern when going in reverse.
								while (pauseTween && pauseTween.endTime() > this._time) {
									pauseTween.render(pauseTween._reversed ? pauseTween.totalDuration() - (time - pauseTween._startTime) * pauseTween._timeScale : (time - pauseTween._startTime) * pauseTween._timeScale, suppressEvents, force);
									pauseTween = pauseTween._prev;
								}
								pauseTween = null;
								this.pause();
							}
							if (!tween._reversed) {
								tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
							} else {
								tween.render((!tween._dirty ? tween._totalDuration : tween.totalDuration()) - (time - tween._startTime) * tween._timeScale, suppressEvents, force);
							}
						}
						tween = next;
					}
				}

				if (this._onUpdate) if (!suppressEvents) {
					if (_lazyTweens.length) {
						//in case rendering caused any tweens to lazy-init, we should render them because typically when a timeline finishes, users expect things to have rendered fully. Imagine an onUpdate on a timeline that reports/checks tweened values.
						_lazyRender();
					}
					this._callback("onUpdate");
				}
				if (callback) if (!this._locked) if (!this._gc) if (prevStart === this._startTime || prevTimeScale !== this._timeScale) if (this._time === 0 || totalDur >= this.totalDuration()) {
					//if one of the tweens that was rendered altered this timeline's startTime (like if an onComplete reversed the timeline), it probably isn't complete. If it is, don't worry, because whatever call altered the startTime would complete if it was necessary at the new time. The only exception is the timeScale property. Also check _gc because there's a chance that kill() could be called in an onUpdate
					if (isComplete) {
						if (_lazyTweens.length) {
							//in case rendering caused any tweens to lazy-init, we should render them because typically when a timeline finishes, users expect things to have rendered fully. Imagine an onComplete on a timeline that reports/checks tweened values.
							_lazyRender();
						}
						if (this._timeline.autoRemoveChildren) {
							this._enabled(false, false);
						}
						this._active = false;
					}
					if (!suppressEvents && this.vars[callback]) {
						this._callback(callback);
					}
				}
			};

			p.getActive = function (nested, tweens, timelines) {
				if (nested == null) {
					nested = true;
				}
				if (tweens == null) {
					tweens = true;
				}
				if (timelines == null) {
					timelines = false;
				}
				var a = [],
				    all = this.getChildren(nested, tweens, timelines),
				    cnt = 0,
				    l = all.length,
				    i,
				    tween;
				for (i = 0; i < l; i++) {
					tween = all[i];
					if (tween.isActive()) {
						a[cnt++] = tween;
					}
				}
				return a;
			};

			p.getLabelAfter = function (time) {
				if (!time) if (time !== 0) {
					//faster than isNan()
					time = this._time;
				}
				var labels = this.getLabelsArray(),
				    l = labels.length,
				    i;
				for (i = 0; i < l; i++) {
					if (labels[i].time > time) {
						return labels[i].name;
					}
				}
				return null;
			};

			p.getLabelBefore = function (time) {
				if (time == null) {
					time = this._time;
				}
				var labels = this.getLabelsArray(),
				    i = labels.length;
				while (--i > -1) {
					if (labels[i].time < time) {
						return labels[i].name;
					}
				}
				return null;
			};

			p.getLabelsArray = function () {
				var a = [],
				    cnt = 0,
				    p;
				for (p in this._labels) {
					a[cnt++] = { time: this._labels[p], name: p };
				}
				a.sort(function (a, b) {
					return a.time - b.time;
				});
				return a;
			};

			//---- GETTERS / SETTERS -------------------------------------------------------------------------------------------------------

			p.progress = function (value, suppressEvents) {
				return !arguments.length ? this._time / this.duration() : this.totalTime(this.duration() * (this._yoyo && (this._cycle & 1) !== 0 ? 1 - value : value) + this._cycle * (this._duration + this._repeatDelay), suppressEvents);
			};

			p.totalProgress = function (value, suppressEvents) {
				return !arguments.length ? this._totalTime / this.totalDuration() : this.totalTime(this.totalDuration() * value, suppressEvents);
			};

			p.totalDuration = function (value) {
				if (!arguments.length) {
					if (this._dirty) {
						TimelineLite.prototype.totalDuration.call(this); //just forces refresh
						//Instead of Infinity, we use 999999999999 so that we can accommodate reverses.
						this._totalDuration = this._repeat === -1 ? 999999999999 : this._duration * (this._repeat + 1) + this._repeatDelay * this._repeat;
					}
					return this._totalDuration;
				}
				return this._repeat === -1 ? this : this.duration((value - this._repeat * this._repeatDelay) / (this._repeat + 1));
			};

			p.time = function (value, suppressEvents) {
				if (!arguments.length) {
					return this._time;
				}
				if (this._dirty) {
					this.totalDuration();
				}
				if (value > this._duration) {
					value = this._duration;
				}
				if (this._yoyo && (this._cycle & 1) !== 0) {
					value = this._duration - value + this._cycle * (this._duration + this._repeatDelay);
				} else if (this._repeat !== 0) {
					value += this._cycle * (this._duration + this._repeatDelay);
				}
				return this.totalTime(value, suppressEvents);
			};

			p.repeat = function (value) {
				if (!arguments.length) {
					return this._repeat;
				}
				this._repeat = value;
				return this._uncache(true);
			};

			p.repeatDelay = function (value) {
				if (!arguments.length) {
					return this._repeatDelay;
				}
				this._repeatDelay = value;
				return this._uncache(true);
			};

			p.yoyo = function (value) {
				if (!arguments.length) {
					return this._yoyo;
				}
				this._yoyo = value;
				return this;
			};

			p.currentLabel = function (value) {
				if (!arguments.length) {
					return this.getLabelBefore(this._time + 0.00000001);
				}
				return this.seek(value, true);
			};

			return TimelineMax;
		}, true);

		/*
   * ----------------------------------------------------------------
   * BezierPlugin
   * ----------------------------------------------------------------
   */
		(function () {

			var _RAD2DEG = 180 / Math.PI,
			    _r1 = [],
			    _r2 = [],
			    _r3 = [],
			    _corProps = {},
			    _globals = _gsScope._gsDefine.globals,
			    Segment = function (a, b, c, d) {
				this.a = a;
				this.b = b;
				this.c = c;
				this.d = d;
				this.da = d - a;
				this.ca = c - a;
				this.ba = b - a;
			},
			    _correlate = ",x,y,z,left,top,right,bottom,marginTop,marginLeft,marginRight,marginBottom,paddingLeft,paddingTop,paddingRight,paddingBottom,backgroundPosition,backgroundPosition_y,",
			    cubicToQuadratic = function (a, b, c, d) {
				var q1 = { a: a },
				    q2 = {},
				    q3 = {},
				    q4 = { c: d },
				    mab = (a + b) / 2,
				    mbc = (b + c) / 2,
				    mcd = (c + d) / 2,
				    mabc = (mab + mbc) / 2,
				    mbcd = (mbc + mcd) / 2,
				    m8 = (mbcd - mabc) / 8;
				q1.b = mab + (a - mab) / 4;
				q2.b = mabc + m8;
				q1.c = q2.a = (q1.b + q2.b) / 2;
				q2.c = q3.a = (mabc + mbcd) / 2;
				q3.b = mbcd - m8;
				q4.b = mcd + (d - mcd) / 4;
				q3.c = q4.a = (q3.b + q4.b) / 2;
				return [q1, q2, q3, q4];
			},
			    _calculateControlPoints = function (a, curviness, quad, basic, correlate) {
				var l = a.length - 1,
				    ii = 0,
				    cp1 = a[0].a,
				    i,
				    p1,
				    p2,
				    p3,
				    seg,
				    m1,
				    m2,
				    mm,
				    cp2,
				    qb,
				    r1,
				    r2,
				    tl;
				for (i = 0; i < l; i++) {
					seg = a[ii];
					p1 = seg.a;
					p2 = seg.d;
					p3 = a[ii + 1].d;

					if (correlate) {
						r1 = _r1[i];
						r2 = _r2[i];
						tl = (r2 + r1) * curviness * 0.25 / (basic ? 0.5 : _r3[i] || 0.5);
						m1 = p2 - (p2 - p1) * (basic ? curviness * 0.5 : r1 !== 0 ? tl / r1 : 0);
						m2 = p2 + (p3 - p2) * (basic ? curviness * 0.5 : r2 !== 0 ? tl / r2 : 0);
						mm = p2 - (m1 + ((m2 - m1) * (r1 * 3 / (r1 + r2) + 0.5) / 4 || 0));
					} else {
						m1 = p2 - (p2 - p1) * curviness * 0.5;
						m2 = p2 + (p3 - p2) * curviness * 0.5;
						mm = p2 - (m1 + m2) / 2;
					}
					m1 += mm;
					m2 += mm;

					seg.c = cp2 = m1;
					if (i !== 0) {
						seg.b = cp1;
					} else {
						seg.b = cp1 = seg.a + (seg.c - seg.a) * 0.6; //instead of placing b on a exactly, we move it inline with c so that if the user specifies an ease like Back.easeIn or Elastic.easeIn which goes BEYOND the beginning, it will do so smoothly.
					}

					seg.da = p2 - p1;
					seg.ca = cp2 - p1;
					seg.ba = cp1 - p1;

					if (quad) {
						qb = cubicToQuadratic(p1, cp1, cp2, p2);
						a.splice(ii, 1, qb[0], qb[1], qb[2], qb[3]);
						ii += 4;
					} else {
						ii++;
					}

					cp1 = m2;
				}
				seg = a[ii];
				seg.b = cp1;
				seg.c = cp1 + (seg.d - cp1) * 0.4; //instead of placing c on d exactly, we move it inline with b so that if the user specifies an ease like Back.easeOut or Elastic.easeOut which goes BEYOND the end, it will do so smoothly.
				seg.da = seg.d - seg.a;
				seg.ca = seg.c - seg.a;
				seg.ba = cp1 - seg.a;
				if (quad) {
					qb = cubicToQuadratic(seg.a, cp1, seg.c, seg.d);
					a.splice(ii, 1, qb[0], qb[1], qb[2], qb[3]);
				}
			},
			    _parseAnchors = function (values, p, correlate, prepend) {
				var a = [],
				    l,
				    i,
				    p1,
				    p2,
				    p3,
				    tmp;
				if (prepend) {
					values = [prepend].concat(values);
					i = values.length;
					while (--i > -1) {
						if (typeof (tmp = values[i][p]) === "string") if (tmp.charAt(1) === "=") {
							values[i][p] = prepend[p] + Number(tmp.charAt(0) + tmp.substr(2)); //accommodate relative values. Do it inline instead of breaking it out into a function for speed reasons
						}
					}
				}
				l = values.length - 2;
				if (l < 0) {
					a[0] = new Segment(values[0][p], 0, 0, values[l < -1 ? 0 : 1][p]);
					return a;
				}
				for (i = 0; i < l; i++) {
					p1 = values[i][p];
					p2 = values[i + 1][p];
					a[i] = new Segment(p1, 0, 0, p2);
					if (correlate) {
						p3 = values[i + 2][p];
						_r1[i] = (_r1[i] || 0) + (p2 - p1) * (p2 - p1);
						_r2[i] = (_r2[i] || 0) + (p3 - p2) * (p3 - p2);
					}
				}
				a[i] = new Segment(values[i][p], 0, 0, values[i + 1][p]);
				return a;
			},
			    bezierThrough = function (values, curviness, quadratic, basic, correlate, prepend) {
				var obj = {},
				    props = [],
				    first = prepend || values[0],
				    i,
				    p,
				    a,
				    j,
				    r,
				    l,
				    seamless,
				    last;
				correlate = typeof correlate === "string" ? "," + correlate + "," : _correlate;
				if (curviness == null) {
					curviness = 1;
				}
				for (p in values[0]) {
					props.push(p);
				}
				//check to see if the last and first values are identical (well, within 0.05). If so, make seamless by appending the second element to the very end of the values array and the 2nd-to-last element to the very beginning (we'll remove those segments later)
				if (values.length > 1) {
					last = values[values.length - 1];
					seamless = true;
					i = props.length;
					while (--i > -1) {
						p = props[i];
						if (Math.abs(first[p] - last[p]) > 0.05) {
							//build in a tolerance of +/-0.05 to accommodate rounding errors. For example, if you set an object's position to 4.945, Flash will make it 4.9
							seamless = false;
							break;
						}
					}
					if (seamless) {
						values = values.concat(); //duplicate the array to avoid contaminating the original which the user may be reusing for other tweens
						if (prepend) {
							values.unshift(prepend);
						}
						values.push(values[1]);
						prepend = values[values.length - 3];
					}
				}
				_r1.length = _r2.length = _r3.length = 0;
				i = props.length;
				while (--i > -1) {
					p = props[i];
					_corProps[p] = correlate.indexOf("," + p + ",") !== -1;
					obj[p] = _parseAnchors(values, p, _corProps[p], prepend);
				}
				i = _r1.length;
				while (--i > -1) {
					_r1[i] = Math.sqrt(_r1[i]);
					_r2[i] = Math.sqrt(_r2[i]);
				}
				if (!basic) {
					i = props.length;
					while (--i > -1) {
						if (_corProps[p]) {
							a = obj[props[i]];
							l = a.length - 1;
							for (j = 0; j < l; j++) {
								r = a[j + 1].da / _r2[j] + a[j].da / _r1[j];
								_r3[j] = (_r3[j] || 0) + r * r;
							}
						}
					}
					i = _r3.length;
					while (--i > -1) {
						_r3[i] = Math.sqrt(_r3[i]);
					}
				}
				i = props.length;
				j = quadratic ? 4 : 1;
				while (--i > -1) {
					p = props[i];
					a = obj[p];
					_calculateControlPoints(a, curviness, quadratic, basic, _corProps[p]); //this method requires that _parseAnchors() and _setSegmentRatios() ran first so that _r1, _r2, and _r3 values are populated for all properties
					if (seamless) {
						a.splice(0, j);
						a.splice(a.length - j, j);
					}
				}
				return obj;
			},
			    _parseBezierData = function (values, type, prepend) {
				type = type || "soft";
				var obj = {},
				    inc = type === "cubic" ? 3 : 2,
				    soft = type === "soft",
				    props = [],
				    a,
				    b,
				    c,
				    d,
				    cur,
				    i,
				    j,
				    l,
				    p,
				    cnt,
				    tmp;
				if (soft && prepend) {
					values = [prepend].concat(values);
				}
				if (values == null || values.length < inc + 1) {
					throw "invalid Bezier data";
				}
				for (p in values[0]) {
					props.push(p);
				}
				i = props.length;
				while (--i > -1) {
					p = props[i];
					obj[p] = cur = [];
					cnt = 0;
					l = values.length;
					for (j = 0; j < l; j++) {
						a = prepend == null ? values[j][p] : typeof (tmp = values[j][p]) === "string" && tmp.charAt(1) === "=" ? prepend[p] + Number(tmp.charAt(0) + tmp.substr(2)) : Number(tmp);
						if (soft) if (j > 1) if (j < l - 1) {
							cur[cnt++] = (a + cur[cnt - 2]) / 2;
						}
						cur[cnt++] = a;
					}
					l = cnt - inc + 1;
					cnt = 0;
					for (j = 0; j < l; j += inc) {
						a = cur[j];
						b = cur[j + 1];
						c = cur[j + 2];
						d = inc === 2 ? 0 : cur[j + 3];
						cur[cnt++] = tmp = inc === 3 ? new Segment(a, b, c, d) : new Segment(a, (2 * b + a) / 3, (2 * b + c) / 3, c);
					}
					cur.length = cnt;
				}
				return obj;
			},
			    _addCubicLengths = function (a, steps, resolution) {
				var inc = 1 / resolution,
				    j = a.length,
				    d,
				    d1,
				    s,
				    da,
				    ca,
				    ba,
				    p,
				    i,
				    inv,
				    bez,
				    index;
				while (--j > -1) {
					bez = a[j];
					s = bez.a;
					da = bez.d - s;
					ca = bez.c - s;
					ba = bez.b - s;
					d = d1 = 0;
					for (i = 1; i <= resolution; i++) {
						p = inc * i;
						inv = 1 - p;
						d = d1 - (d1 = (p * p * da + 3 * inv * (p * ca + inv * ba)) * p);
						index = j * resolution + i - 1;
						steps[index] = (steps[index] || 0) + d * d;
					}
				}
			},
			    _parseLengthData = function (obj, resolution) {
				resolution = resolution >> 0 || 6;
				var a = [],
				    lengths = [],
				    d = 0,
				    total = 0,
				    threshold = resolution - 1,
				    segments = [],
				    curLS = [],
				    //current length segments array
				p,
				    i,
				    l,
				    index;
				for (p in obj) {
					_addCubicLengths(obj[p], a, resolution);
				}
				l = a.length;
				for (i = 0; i < l; i++) {
					d += Math.sqrt(a[i]);
					index = i % resolution;
					curLS[index] = d;
					if (index === threshold) {
						total += d;
						index = i / resolution >> 0;
						segments[index] = curLS;
						lengths[index] = total;
						d = 0;
						curLS = [];
					}
				}
				return { length: total, lengths: lengths, segments: segments };
			},
			    BezierPlugin = _gsScope._gsDefine.plugin({
				propName: "bezier",
				priority: -1,
				version: "1.3.4",
				API: 2,
				global: true,

				//gets called when the tween renders for the first time. This is where initial values should be recorded and any setup routines should run.
				init: function (target, vars, tween) {
					this._target = target;
					if (vars instanceof Array) {
						vars = { values: vars };
					}
					this._func = {};
					this._round = {};
					this._props = [];
					this._timeRes = vars.timeResolution == null ? 6 : parseInt(vars.timeResolution, 10);
					var values = vars.values || [],
					    first = {},
					    second = values[0],
					    autoRotate = vars.autoRotate || tween.vars.orientToBezier,
					    p,
					    isFunc,
					    i,
					    j,
					    prepend;

					this._autoRotate = autoRotate ? autoRotate instanceof Array ? autoRotate : [["x", "y", "rotation", autoRotate === true ? 0 : Number(autoRotate) || 0]] : null;
					for (p in second) {
						this._props.push(p);
					}

					i = this._props.length;
					while (--i > -1) {
						p = this._props[i];

						this._overwriteProps.push(p);
						isFunc = this._func[p] = typeof target[p] === "function";
						first[p] = !isFunc ? parseFloat(target[p]) : target[p.indexOf("set") || typeof target["get" + p.substr(3)] !== "function" ? p : "get" + p.substr(3)]();
						if (!prepend) if (first[p] !== values[0][p]) {
							prepend = first;
						}
					}
					this._beziers = vars.type !== "cubic" && vars.type !== "quadratic" && vars.type !== "soft" ? bezierThrough(values, isNaN(vars.curviness) ? 1 : vars.curviness, false, vars.type === "thruBasic", vars.correlate, prepend) : _parseBezierData(values, vars.type, first);
					this._segCount = this._beziers[p].length;

					if (this._timeRes) {
						var ld = _parseLengthData(this._beziers, this._timeRes);
						this._length = ld.length;
						this._lengths = ld.lengths;
						this._segments = ld.segments;
						this._l1 = this._li = this._s1 = this._si = 0;
						this._l2 = this._lengths[0];
						this._curSeg = this._segments[0];
						this._s2 = this._curSeg[0];
						this._prec = 1 / this._curSeg.length;
					}

					if (autoRotate = this._autoRotate) {
						this._initialRotations = [];
						if (!(autoRotate[0] instanceof Array)) {
							this._autoRotate = autoRotate = [autoRotate];
						}
						i = autoRotate.length;
						while (--i > -1) {
							for (j = 0; j < 3; j++) {
								p = autoRotate[i][j];
								this._func[p] = typeof target[p] === "function" ? target[p.indexOf("set") || typeof target["get" + p.substr(3)] !== "function" ? p : "get" + p.substr(3)] : false;
							}
							p = autoRotate[i][2];
							this._initialRotations[i] = this._func[p] ? this._func[p].call(this._target) : this._target[p];
						}
					}
					this._startRatio = tween.vars.runBackwards ? 1 : 0; //we determine the starting ratio when the tween inits which is always 0 unless the tween has runBackwards:true (indicating it's a from() tween) in which case it's 1.
					return true;
				},

				//called each time the values should be updated, and the ratio gets passed as the only parameter (typically it's a value between 0 and 1, but it can exceed those when using an ease like Elastic.easeOut or Back.easeOut, etc.)
				set: function (v) {
					var segments = this._segCount,
					    func = this._func,
					    target = this._target,
					    notStart = v !== this._startRatio,
					    curIndex,
					    inv,
					    i,
					    p,
					    b,
					    t,
					    val,
					    l,
					    lengths,
					    curSeg;
					if (!this._timeRes) {
						curIndex = v < 0 ? 0 : v >= 1 ? segments - 1 : segments * v >> 0;
						t = (v - curIndex * (1 / segments)) * segments;
					} else {
						lengths = this._lengths;
						curSeg = this._curSeg;
						v *= this._length;
						i = this._li;
						//find the appropriate segment (if the currently cached one isn't correct)
						if (v > this._l2 && i < segments - 1) {
							l = segments - 1;
							while (i < l && (this._l2 = lengths[++i]) <= v) {}
							this._l1 = lengths[i - 1];
							this._li = i;
							this._curSeg = curSeg = this._segments[i];
							this._s2 = curSeg[this._s1 = this._si = 0];
						} else if (v < this._l1 && i > 0) {
							while (i > 0 && (this._l1 = lengths[--i]) >= v) {}
							if (i === 0 && v < this._l1) {
								this._l1 = 0;
							} else {
								i++;
							}
							this._l2 = lengths[i];
							this._li = i;
							this._curSeg = curSeg = this._segments[i];
							this._s1 = curSeg[(this._si = curSeg.length - 1) - 1] || 0;
							this._s2 = curSeg[this._si];
						}
						curIndex = i;
						//now find the appropriate sub-segment (we split it into the number of pieces that was defined by "precision" and measured each one)
						v -= this._l1;
						i = this._si;
						if (v > this._s2 && i < curSeg.length - 1) {
							l = curSeg.length - 1;
							while (i < l && (this._s2 = curSeg[++i]) <= v) {}
							this._s1 = curSeg[i - 1];
							this._si = i;
						} else if (v < this._s1 && i > 0) {
							while (i > 0 && (this._s1 = curSeg[--i]) >= v) {}
							if (i === 0 && v < this._s1) {
								this._s1 = 0;
							} else {
								i++;
							}
							this._s2 = curSeg[i];
							this._si = i;
						}
						t = (i + (v - this._s1) / (this._s2 - this._s1)) * this._prec;
					}
					inv = 1 - t;

					i = this._props.length;
					while (--i > -1) {
						p = this._props[i];
						b = this._beziers[p][curIndex];
						val = (t * t * b.da + 3 * inv * (t * b.ca + inv * b.ba)) * t + b.a;
						if (this._round[p]) {
							val = Math.round(val);
						}
						if (func[p]) {
							target[p](val);
						} else {
							target[p] = val;
						}
					}

					if (this._autoRotate) {
						var ar = this._autoRotate,
						    b2,
						    x1,
						    y1,
						    x2,
						    y2,
						    add,
						    conv;
						i = ar.length;
						while (--i > -1) {
							p = ar[i][2];
							add = ar[i][3] || 0;
							conv = ar[i][4] === true ? 1 : _RAD2DEG;
							b = this._beziers[ar[i][0]];
							b2 = this._beziers[ar[i][1]];

							if (b && b2) {
								//in case one of the properties got overwritten.
								b = b[curIndex];
								b2 = b2[curIndex];

								x1 = b.a + (b.b - b.a) * t;
								x2 = b.b + (b.c - b.b) * t;
								x1 += (x2 - x1) * t;
								x2 += (b.c + (b.d - b.c) * t - x2) * t;

								y1 = b2.a + (b2.b - b2.a) * t;
								y2 = b2.b + (b2.c - b2.b) * t;
								y1 += (y2 - y1) * t;
								y2 += (b2.c + (b2.d - b2.c) * t - y2) * t;

								val = notStart ? Math.atan2(y2 - y1, x2 - x1) * conv + add : this._initialRotations[i];

								if (func[p]) {
									target[p](val);
								} else {
									target[p] = val;
								}
							}
						}
					}
				}
			}),
			    p = BezierPlugin.prototype;

			BezierPlugin.bezierThrough = bezierThrough;
			BezierPlugin.cubicToQuadratic = cubicToQuadratic;
			BezierPlugin._autoCSS = true; //indicates that this plugin can be inserted into the "css" object using the autoCSS feature of TweenLite
			BezierPlugin.quadraticToCubic = function (a, b, c) {
				return new Segment(a, (2 * b + a) / 3, (2 * b + c) / 3, c);
			};

			BezierPlugin._cssRegister = function () {
				var CSSPlugin = _globals.CSSPlugin;
				if (!CSSPlugin) {
					return;
				}
				var _internals = CSSPlugin._internals,
				    _parseToProxy = _internals._parseToProxy,
				    _setPluginRatio = _internals._setPluginRatio,
				    CSSPropTween = _internals.CSSPropTween;
				_internals._registerComplexSpecialProp("bezier", { parser: function (t, e, prop, cssp, pt, plugin) {
						if (e instanceof Array) {
							e = { values: e };
						}
						plugin = new BezierPlugin();
						var values = e.values,
						    l = values.length - 1,
						    pluginValues = [],
						    v = {},
						    i,
						    p,
						    data;
						if (l < 0) {
							return pt;
						}
						for (i = 0; i <= l; i++) {
							data = _parseToProxy(t, values[i], cssp, pt, plugin, l !== i);
							pluginValues[i] = data.end;
						}
						for (p in e) {
							v[p] = e[p]; //duplicate the vars object because we need to alter some things which would cause problems if the user plans to reuse the same vars object for another tween.
						}
						v.values = pluginValues;
						pt = new CSSPropTween(t, "bezier", 0, 0, data.pt, 2);
						pt.data = data;
						pt.plugin = plugin;
						pt.setRatio = _setPluginRatio;
						if (v.autoRotate === 0) {
							v.autoRotate = true;
						}
						if (v.autoRotate && !(v.autoRotate instanceof Array)) {
							i = v.autoRotate === true ? 0 : Number(v.autoRotate);
							v.autoRotate = data.end.left != null ? [["left", "top", "rotation", i, false]] : data.end.x != null ? [["x", "y", "rotation", i, false]] : false;
						}
						if (v.autoRotate) {
							if (!cssp._transform) {
								cssp._enableTransforms(false);
							}
							data.autoRotate = cssp._target._gsTransform;
						}
						plugin._onInitTween(data.proxy, v, cssp._tween);
						return pt;
					} });
			};

			p._roundProps = function (lookup, value) {
				var op = this._overwriteProps,
				    i = op.length;
				while (--i > -1) {
					if (lookup[op[i]] || lookup.bezier || lookup.bezierThrough) {
						this._round[op[i]] = value;
					}
				}
			};

			p._kill = function (lookup) {
				var a = this._props,
				    p,
				    i;
				for (p in this._beziers) {
					if (p in lookup) {
						delete this._beziers[p];
						delete this._func[p];
						i = a.length;
						while (--i > -1) {
							if (a[i] === p) {
								a.splice(i, 1);
							}
						}
					}
				}
				return this._super._kill.call(this, lookup);
			};
		})();

		/*
   * ----------------------------------------------------------------
   * CSSPlugin
   * ----------------------------------------------------------------
   */
		_gsScope._gsDefine("plugins.CSSPlugin", ["plugins.TweenPlugin", "TweenLite"], function (TweenPlugin, TweenLite) {

			/** @constructor **/
			var CSSPlugin = function () {
				TweenPlugin.call(this, "css");
				this._overwriteProps.length = 0;
				this.setRatio = CSSPlugin.prototype.setRatio; //speed optimization (avoid prototype lookup on this "hot" method)
			},
			    _globals = _gsScope._gsDefine.globals,
			    _hasPriority,
			    //turns true whenever a CSSPropTween instance is created that has a priority other than 0. This helps us discern whether or not we should spend the time organizing the linked list or not after a CSSPlugin's _onInitTween() method is called.
			_suffixMap,
			    //we set this in _onInitTween() each time as a way to have a persistent variable we can use in other methods like _parse() without having to pass it around as a parameter and we keep _parse() decoupled from a particular CSSPlugin instance
			_cs,
			    //computed style (we store this in a shared variable to conserve memory and make minification tighter
			_overwriteProps,
			    //alias to the currently instantiating CSSPlugin's _overwriteProps array. We use this closure in order to avoid having to pass a reference around from method to method and aid in minification.
			_specialProps = {},
			    p = CSSPlugin.prototype = new TweenPlugin("css");

			p.constructor = CSSPlugin;
			CSSPlugin.version = "1.18.0";
			CSSPlugin.API = 2;
			CSSPlugin.defaultTransformPerspective = 0;
			CSSPlugin.defaultSkewType = "compensated";
			CSSPlugin.defaultSmoothOrigin = true;
			p = "px"; //we'll reuse the "p" variable to keep file size down
			CSSPlugin.suffixMap = { top: p, right: p, bottom: p, left: p, width: p, height: p, fontSize: p, padding: p, margin: p, perspective: p, lineHeight: "" };

			var _numExp = /(?:\d|\-\d|\.\d|\-\.\d)+/g,
			    _relNumExp = /(?:\d|\-\d|\.\d|\-\.\d|\+=\d|\-=\d|\+=.\d|\-=\.\d)+/g,
			    _valuesExp = /(?:\+=|\-=|\-|\b)[\d\-\.]+[a-zA-Z0-9]*(?:%|\b)/gi,
			    //finds all the values that begin with numbers or += or -= and then a number. Includes suffixes. We use this to split complex values apart like "1px 5px 20px rgb(255,102,51)"
			_NaNExp = /(?![+-]?\d*\.?\d+|[+-]|e[+-]\d+)[^0-9]/g,
			    //also allows scientific notation and doesn't kill the leading -/+ in -= and +=
			_suffixExp = /(?:\d|\-|\+|=|#|\.)*/g,
			    _opacityExp = /opacity *= *([^)]*)/i,
			    _opacityValExp = /opacity:([^;]*)/i,
			    _alphaFilterExp = /alpha\(opacity *=.+?\)/i,
			    _rgbhslExp = /^(rgb|hsl)/,
			    _capsExp = /([A-Z])/g,
			    _camelExp = /-([a-z])/gi,
			    _urlExp = /(^(?:url\(\"|url\())|(?:(\"\))$|\)$)/gi,
			    //for pulling out urls from url(...) or url("...") strings (some browsers wrap urls in quotes, some don't when reporting things like backgroundImage)
			_camelFunc = function (s, g) {
				return g.toUpperCase();
			},
			    _horizExp = /(?:Left|Right|Width)/i,
			    _ieGetMatrixExp = /(M11|M12|M21|M22)=[\d\-\.e]+/gi,
			    _ieSetMatrixExp = /progid\:DXImageTransform\.Microsoft\.Matrix\(.+?\)/i,
			    _commasOutsideParenExp = /,(?=[^\)]*(?:\(|$))/gi,
			    //finds any commas that are not within parenthesis
			_DEG2RAD = Math.PI / 180,
			    _RAD2DEG = 180 / Math.PI,
			    _forcePT = {},
			    _doc = document,
			    _createElement = function (type) {
				return _doc.createElementNS ? _doc.createElementNS("http://www.w3.org/1999/xhtml", type) : _doc.createElement(type);
			},
			    _tempDiv = _createElement("div"),
			    _tempImg = _createElement("img"),
			    _internals = CSSPlugin._internals = { _specialProps: _specialProps },
			    //provides a hook to a few internal methods that we need to access from inside other plugins
			_agent = navigator.userAgent,
			    _autoRound,
			    _reqSafariFix,
			    //we won't apply the Safari transform fix until we actually come across a tween that affects a transform property (to maintain best performance).

			_isSafari,
			    _isFirefox,
			    //Firefox has a bug that causes 3D transformed elements to randomly disappear unless a repaint is forced after each update on each element.
			_isSafariLT6,
			    //Safari (and Android 4 which uses a flavor of Safari) has a bug that prevents changes to "top" and "left" properties from rendering properly if changed on the same frame as a transform UNLESS we set the element's WebkitBackfaceVisibility to hidden (weird, I know). Doing this for Android 3 and earlier seems to actually cause other problems, though (fun!)
			_ieVers,
			    _supportsOpacity = function () {
				//we set _isSafari, _ieVers, _isFirefox, and _supportsOpacity all in one function here to reduce file size slightly, especially in the minified version.
				var i = _agent.indexOf("Android"),
				    a = _createElement("a");
				_isSafari = _agent.indexOf("Safari") !== -1 && _agent.indexOf("Chrome") === -1 && (i === -1 || Number(_agent.substr(i + 8, 1)) > 3);
				_isSafariLT6 = _isSafari && Number(_agent.substr(_agent.indexOf("Version/") + 8, 1)) < 6;
				_isFirefox = _agent.indexOf("Firefox") !== -1;
				if (/MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(_agent) || /Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/.exec(_agent)) {
					_ieVers = parseFloat(RegExp.$1);
				}
				if (!a) {
					return false;
				}
				a.style.cssText = "top:1px;opacity:.55;";
				return (/^0.55/.test(a.style.opacity)
				);
			}(),
			    _getIEOpacity = function (v) {
				return _opacityExp.test(typeof v === "string" ? v : (v.currentStyle ? v.currentStyle.filter : v.style.filter) || "") ? parseFloat(RegExp.$1) / 100 : 1;
			},
			    _log = function (s) {
				//for logging messages, but in a way that won't throw errors in old versions of IE.
				if (window.console) {
					console.log(s);
				}
			},
			    _prefixCSS = "",
			    //the non-camelCase vendor prefix like "-o-", "-moz-", "-ms-", or "-webkit-"
			_prefix = "",
			    //camelCase vendor prefix like "O", "ms", "Webkit", or "Moz".

			// @private feed in a camelCase property name like "transform" and it will check to see if it is valid as-is or if it needs a vendor prefix. It returns the corrected camelCase property name (i.e. "WebkitTransform" or "MozTransform" or "transform" or null if no such property is found, like if the browser is IE8 or before, "transform" won't be found at all)
			_checkPropPrefix = function (p, e) {
				e = e || _tempDiv;
				var s = e.style,
				    a,
				    i;
				if (s[p] !== undefined) {
					return p;
				}
				p = p.charAt(0).toUpperCase() + p.substr(1);
				a = ["O", "Moz", "ms", "Ms", "Webkit"];
				i = 5;
				while (--i > -1 && s[a[i] + p] === undefined) {}
				if (i >= 0) {
					_prefix = i === 3 ? "ms" : a[i];
					_prefixCSS = "-" + _prefix.toLowerCase() + "-";
					return _prefix + p;
				}
				return null;
			},
			    _getComputedStyle = _doc.defaultView ? _doc.defaultView.getComputedStyle : function () {},


			/**
    * @private Returns the css style for a particular property of an element. For example, to get whatever the current "left" css value for an element with an ID of "myElement", you could do:
    * var currentLeft = CSSPlugin.getStyle( document.getElementById("myElement"), "left");
    *
    * @param {!Object} t Target element whose style property you want to query
    * @param {!string} p Property name (like "left" or "top" or "marginTop", etc.)
    * @param {Object=} cs Computed style object. This just provides a way to speed processing if you're going to get several properties on the same element in quick succession - you can reuse the result of the getComputedStyle() call.
    * @param {boolean=} calc If true, the value will not be read directly from the element's "style" property (if it exists there), but instead the getComputedStyle() result will be used. This can be useful when you want to ensure that the browser itself is interpreting the value.
    * @param {string=} dflt Default value that should be returned in the place of null, "none", "auto" or "auto auto".
    * @return {?string} The current property value
    */
			_getStyle = CSSPlugin.getStyle = function (t, p, cs, calc, dflt) {
				var rv;
				if (!_supportsOpacity) if (p === "opacity") {
					//several versions of IE don't use the standard "opacity" property - they use things like filter:alpha(opacity=50), so we parse that here.
					return _getIEOpacity(t);
				}
				if (!calc && t.style[p]) {
					rv = t.style[p];
				} else if (cs = cs || _getComputedStyle(t)) {
					rv = cs[p] || cs.getPropertyValue(p) || cs.getPropertyValue(p.replace(_capsExp, "-$1").toLowerCase());
				} else if (t.currentStyle) {
					rv = t.currentStyle[p];
				}
				return dflt != null && (!rv || rv === "none" || rv === "auto" || rv === "auto auto") ? dflt : rv;
			},


			/**
    * @private Pass the target element, the property name, the numeric value, and the suffix (like "%", "em", "px", etc.) and it will spit back the equivalent pixel number.
    * @param {!Object} t Target element
    * @param {!string} p Property name (like "left", "top", "marginLeft", etc.)
    * @param {!number} v Value
    * @param {string=} sfx Suffix (like "px" or "%" or "em")
    * @param {boolean=} recurse If true, the call is a recursive one. In some browsers (like IE7/8), occasionally the value isn't accurately reported initially, but if we run the function again it will take effect.
    * @return {number} value in pixels
    */
			_convertToPixels = _internals.convertToPixels = function (t, p, v, sfx, recurse) {
				if (sfx === "px" || !sfx) {
					return v;
				}
				if (sfx === "auto" || !v) {
					return 0;
				}
				var horiz = _horizExp.test(p),
				    node = t,
				    style = _tempDiv.style,
				    neg = v < 0,
				    pix,
				    cache,
				    time;
				if (neg) {
					v = -v;
				}
				if (sfx === "%" && p.indexOf("border") !== -1) {
					pix = v / 100 * (horiz ? t.clientWidth : t.clientHeight);
				} else {
					style.cssText = "border:0 solid red;position:" + _getStyle(t, "position") + ";line-height:0;";
					if (sfx === "%" || !node.appendChild || sfx.charAt(0) === "v" || sfx === "rem") {
						node = t.parentNode || _doc.body;
						cache = node._gsCache;
						time = TweenLite.ticker.frame;
						if (cache && horiz && cache.time === time) {
							//performance optimization: we record the width of elements along with the ticker frame so that we can quickly get it again on the same tick (seems relatively safe to assume it wouldn't change on the same tick)
							return cache.width * v / 100;
						}
						style[horiz ? "width" : "height"] = v + sfx;
					} else {
						style[horiz ? "borderLeftWidth" : "borderTopWidth"] = v + sfx;
					}
					node.appendChild(_tempDiv);
					pix = parseFloat(_tempDiv[horiz ? "offsetWidth" : "offsetHeight"]);
					node.removeChild(_tempDiv);
					if (horiz && sfx === "%" && CSSPlugin.cacheWidths !== false) {
						cache = node._gsCache = node._gsCache || {};
						cache.time = time;
						cache.width = pix / v * 100;
					}
					if (pix === 0 && !recurse) {
						pix = _convertToPixels(t, p, v, sfx, true);
					}
				}
				return neg ? -pix : pix;
			},
			    _calculateOffset = _internals.calculateOffset = function (t, p, cs) {
				//for figuring out "top" or "left" in px when it's "auto". We need to factor in margin with the offsetLeft/offsetTop
				if (_getStyle(t, "position", cs) !== "absolute") {
					return 0;
				}
				var dim = p === "left" ? "Left" : "Top",
				    v = _getStyle(t, "margin" + dim, cs);
				return t["offset" + dim] - (_convertToPixels(t, p, parseFloat(v), v.replace(_suffixExp, "")) || 0);
			},


			// @private returns at object containing ALL of the style properties in camelCase and their associated values.
			_getAllStyles = function (t, cs) {
				var s = {},
				    i,
				    tr,
				    p;
				if (cs = cs || _getComputedStyle(t, null)) {
					if (i = cs.length) {
						while (--i > -1) {
							p = cs[i];
							if (p.indexOf("-transform") === -1 || _transformPropCSS === p) {
								//Some webkit browsers duplicate transform values, one non-prefixed and one prefixed ("transform" and "WebkitTransform"), so we must weed out the extra one here.
								s[p.replace(_camelExp, _camelFunc)] = cs.getPropertyValue(p);
							}
						}
					} else {
						//some browsers behave differently - cs.length is always 0, so we must do a for...in loop.
						for (i in cs) {
							if (i.indexOf("Transform") === -1 || _transformProp === i) {
								//Some webkit browsers duplicate transform values, one non-prefixed and one prefixed ("transform" and "WebkitTransform"), so we must weed out the extra one here.
								s[i] = cs[i];
							}
						}
					}
				} else if (cs = t.currentStyle || t.style) {
					for (i in cs) {
						if (typeof i === "string" && s[i] === undefined) {
							s[i.replace(_camelExp, _camelFunc)] = cs[i];
						}
					}
				}
				if (!_supportsOpacity) {
					s.opacity = _getIEOpacity(t);
				}
				tr = _getTransform(t, cs, false);
				s.rotation = tr.rotation;
				s.skewX = tr.skewX;
				s.scaleX = tr.scaleX;
				s.scaleY = tr.scaleY;
				s.x = tr.x;
				s.y = tr.y;
				if (_supports3D) {
					s.z = tr.z;
					s.rotationX = tr.rotationX;
					s.rotationY = tr.rotationY;
					s.scaleZ = tr.scaleZ;
				}
				if (s.filters) {
					delete s.filters;
				}
				return s;
			},


			// @private analyzes two style objects (as returned by _getAllStyles()) and only looks for differences between them that contain tweenable values (like a number or color). It returns an object with a "difs" property which refers to an object containing only those isolated properties and values for tweening, and a "firstMPT" property which refers to the first MiniPropTween instance in a linked list that recorded all the starting values of the different properties so that we can revert to them at the end or beginning of the tween - we don't want the cascading to get messed up. The forceLookup parameter is an optional generic object with properties that should be forced into the results - this is necessary for className tweens that are overwriting others because imagine a scenario where a rollover/rollout adds/removes a class and the user swipes the mouse over the target SUPER fast, thus nothing actually changed yet and the subsequent comparison of the properties would indicate they match (especially when px rounding is taken into consideration), thus no tweening is necessary even though it SHOULD tween and remove those properties after the tween (otherwise the inline styles will contaminate things). See the className SpecialProp code for details.
			_cssDif = function (t, s1, s2, vars, forceLookup) {
				var difs = {},
				    style = t.style,
				    val,
				    p,
				    mpt;
				for (p in s2) {
					if (p !== "cssText") if (p !== "length") if (isNaN(p)) if (s1[p] !== (val = s2[p]) || forceLookup && forceLookup[p]) if (p.indexOf("Origin") === -1) if (typeof val === "number" || typeof val === "string") {
						difs[p] = val === "auto" && (p === "left" || p === "top") ? _calculateOffset(t, p) : (val === "" || val === "auto" || val === "none") && typeof s1[p] === "string" && s1[p].replace(_NaNExp, "") !== "" ? 0 : val; //if the ending value is defaulting ("" or "auto"), we check the starting value and if it can be parsed into a number (a string which could have a suffix too, like 700px), then we swap in 0 for "" or "auto" so that things actually tween.
						if (style[p] !== undefined) {
							//for className tweens, we must remember which properties already existed inline - the ones that didn't should be removed when the tween isn't in progress because they were only introduced to facilitate the transition between classes.
							mpt = new MiniPropTween(style, p, style[p], mpt);
						}
					}
				}
				if (vars) {
					for (p in vars) {
						//copy properties (except className)
						if (p !== "className") {
							difs[p] = vars[p];
						}
					}
				}
				return { difs: difs, firstMPT: mpt };
			},
			    _dimensions = { width: ["Left", "Right"], height: ["Top", "Bottom"] },
			    _margins = ["marginLeft", "marginRight", "marginTop", "marginBottom"],


			/**
    * @private Gets the width or height of an element
    * @param {!Object} t Target element
    * @param {!string} p Property name ("width" or "height")
    * @param {Object=} cs Computed style object (if one exists). Just a speed optimization.
    * @return {number} Dimension (in pixels)
    */
			_getDimension = function (t, p, cs) {
				var v = parseFloat(p === "width" ? t.offsetWidth : t.offsetHeight),
				    a = _dimensions[p],
				    i = a.length;
				cs = cs || _getComputedStyle(t, null);
				while (--i > -1) {
					v -= parseFloat(_getStyle(t, "padding" + a[i], cs, true)) || 0;
					v -= parseFloat(_getStyle(t, "border" + a[i] + "Width", cs, true)) || 0;
				}
				return v;
			},


			// @private Parses position-related complex strings like "top left" or "50px 10px" or "70% 20%", etc. which are used for things like transformOrigin or backgroundPosition. Optionally decorates a supplied object (recObj) with the following properties: "ox" (offsetX), "oy" (offsetY), "oxp" (if true, "ox" is a percentage not a pixel value), and "oxy" (if true, "oy" is a percentage not a pixel value)
			_parsePosition = function (v, recObj) {
				if (v === "contain" || v === "auto" || v === "auto auto") {
					return v + " ";
				}
				if (v == null || v === "") {
					//note: Firefox uses "auto auto" as default whereas Chrome uses "auto".
					v = "0 0";
				}
				var a = v.split(" "),
				    x = v.indexOf("left") !== -1 ? "0%" : v.indexOf("right") !== -1 ? "100%" : a[0],
				    y = v.indexOf("top") !== -1 ? "0%" : v.indexOf("bottom") !== -1 ? "100%" : a[1];
				if (y == null) {
					y = x === "center" ? "50%" : "0";
				} else if (y === "center") {
					y = "50%";
				}
				if (x === "center" || isNaN(parseFloat(x)) && (x + "").indexOf("=") === -1) {
					//remember, the user could flip-flop the values and say "bottom center" or "center bottom", etc. "center" is ambiguous because it could be used to describe horizontal or vertical, hence the isNaN(). If there's an "=" sign in the value, it's relative.
					x = "50%";
				}
				v = x + " " + y + (a.length > 2 ? " " + a[2] : "");
				if (recObj) {
					recObj.oxp = x.indexOf("%") !== -1;
					recObj.oyp = y.indexOf("%") !== -1;
					recObj.oxr = x.charAt(1) === "=";
					recObj.oyr = y.charAt(1) === "=";
					recObj.ox = parseFloat(x.replace(_NaNExp, ""));
					recObj.oy = parseFloat(y.replace(_NaNExp, ""));
					recObj.v = v;
				}
				return recObj || v;
			},


			/**
    * @private Takes an ending value (typically a string, but can be a number) and a starting value and returns the change between the two, looking for relative value indicators like += and -= and it also ignores suffixes (but make sure the ending value starts with a number or +=/-= and that the starting value is a NUMBER!)
    * @param {(number|string)} e End value which is typically a string, but could be a number
    * @param {(number|string)} b Beginning value which is typically a string but could be a number
    * @return {number} Amount of change between the beginning and ending values (relative values that have a "+=" or "-=" are recognized)
    */
			_parseChange = function (e, b) {
				return typeof e === "string" && e.charAt(1) === "=" ? parseInt(e.charAt(0) + "1", 10) * parseFloat(e.substr(2)) : parseFloat(e) - parseFloat(b);
			},


			/**
    * @private Takes a value and a default number, checks if the value is relative, null, or numeric and spits back a normalized number accordingly. Primarily used in the _parseTransform() function.
    * @param {Object} v Value to be parsed
    * @param {!number} d Default value (which is also used for relative calculations if "+=" or "-=" is found in the first parameter)
    * @return {number} Parsed value
    */
			_parseVal = function (v, d) {
				return v == null ? d : typeof v === "string" && v.charAt(1) === "=" ? parseInt(v.charAt(0) + "1", 10) * parseFloat(v.substr(2)) + d : parseFloat(v);
			},


			/**
    * @private Translates strings like "40deg" or "40" or 40rad" or "+=40deg" or "270_short" or "-90_cw" or "+=45_ccw" to a numeric radian angle. Of course a starting/default value must be fed in too so that relative values can be calculated properly.
    * @param {Object} v Value to be parsed
    * @param {!number} d Default value (which is also used for relative calculations if "+=" or "-=" is found in the first parameter)
    * @param {string=} p property name for directionalEnd (optional - only used when the parsed value is directional ("_short", "_cw", or "_ccw" suffix). We need a way to store the uncompensated value so that at the end of the tween, we set it to exactly what was requested with no directional compensation). Property name would be "rotation", "rotationX", or "rotationY"
    * @param {Object=} directionalEnd An object that will store the raw end values for directional angles ("_short", "_cw", or "_ccw" suffix). We need a way to store the uncompensated value so that at the end of the tween, we set it to exactly what was requested with no directional compensation.
    * @return {number} parsed angle in radians
    */
			_parseAngle = function (v, d, p, directionalEnd) {
				var min = 0.000001,
				    cap,
				    split,
				    dif,
				    result,
				    isRelative;
				if (v == null) {
					result = d;
				} else if (typeof v === "number") {
					result = v;
				} else {
					cap = 360;
					split = v.split("_");
					isRelative = v.charAt(1) === "=";
					dif = (isRelative ? parseInt(v.charAt(0) + "1", 10) * parseFloat(split[0].substr(2)) : parseFloat(split[0])) * (v.indexOf("rad") === -1 ? 1 : _RAD2DEG) - (isRelative ? 0 : d);
					if (split.length) {
						if (directionalEnd) {
							directionalEnd[p] = d + dif;
						}
						if (v.indexOf("short") !== -1) {
							dif = dif % cap;
							if (dif !== dif % (cap / 2)) {
								dif = dif < 0 ? dif + cap : dif - cap;
							}
						}
						if (v.indexOf("_cw") !== -1 && dif < 0) {
							dif = (dif + cap * 9999999999) % cap - (dif / cap | 0) * cap;
						} else if (v.indexOf("ccw") !== -1 && dif > 0) {
							dif = (dif - cap * 9999999999) % cap - (dif / cap | 0) * cap;
						}
					}
					result = d + dif;
				}
				if (result < min && result > -min) {
					result = 0;
				}
				return result;
			},
			    _colorLookup = { aqua: [0, 255, 255],
				lime: [0, 255, 0],
				silver: [192, 192, 192],
				black: [0, 0, 0],
				maroon: [128, 0, 0],
				teal: [0, 128, 128],
				blue: [0, 0, 255],
				navy: [0, 0, 128],
				white: [255, 255, 255],
				fuchsia: [255, 0, 255],
				olive: [128, 128, 0],
				yellow: [255, 255, 0],
				orange: [255, 165, 0],
				gray: [128, 128, 128],
				purple: [128, 0, 128],
				green: [0, 128, 0],
				red: [255, 0, 0],
				pink: [255, 192, 203],
				cyan: [0, 255, 255],
				transparent: [255, 255, 255, 0] },
			    _hue = function (h, m1, m2) {
				h = h < 0 ? h + 1 : h > 1 ? h - 1 : h;
				return (h * 6 < 1 ? m1 + (m2 - m1) * h * 6 : h < 0.5 ? m2 : h * 3 < 2 ? m1 + (m2 - m1) * (2 / 3 - h) * 6 : m1) * 255 + 0.5 | 0;
			},


			/**
    * @private Parses a color (like #9F0, #FF9900, rgb(255,51,153) or hsl(108, 50%, 10%)) into an array with 3 elements for red, green, and blue or if toHSL parameter is true, it will populate the array with hue, saturation, and lightness values. If a relative value is found in an hsl() or hsla() string, it will preserve those relative prefixes and all the values in the array will be strings instead of numbers (in all other cases it will be populated with numbers).
    * @param {(string|number)} v The value the should be parsed which could be a string like #9F0 or rgb(255,102,51) or rgba(255,0,0,0.5) or it could be a number like 0xFF00CC or even a named color like red, blue, purple, etc.
    * @param {(boolean)} toHSL If true, an hsl() or hsla() value will be returned instead of rgb() or rgba()
    * @return {Array.<number>} An array containing red, green, and blue (and optionally alpha) in that order, or if the toHSL parameter was true, the array will contain hue, saturation and lightness (and optionally alpha) in that order. Always numbers unless there's a relative prefix found in an hsl() or hsla() string and toHSL is true.
    */
			_parseColor = CSSPlugin.parseColor = function (v, toHSL) {
				var a, r, g, b, h, s, l, max, min, d, wasHSL;
				if (!v) {
					a = _colorLookup.black;
				} else if (typeof v === "number") {
					a = [v >> 16, v >> 8 & 255, v & 255];
				} else {
					if (v.charAt(v.length - 1) === ",") {
						//sometimes a trailing comma is included and we should chop it off (typically from a comma-delimited list of values like a textShadow:"2px 2px 2px blue, 5px 5px 5px rgb(255,0,0)" - in this example "blue," has a trailing comma. We could strip it out inside parseComplex() but we'd need to do it to the beginning and ending values plus it wouldn't provide protection from other potential scenarios like if the user passes in a similar value.
						v = v.substr(0, v.length - 1);
					}
					if (_colorLookup[v]) {
						a = _colorLookup[v];
					} else if (v.charAt(0) === "#") {
						if (v.length === 4) {
							//for shorthand like #9F0
							r = v.charAt(1);
							g = v.charAt(2);
							b = v.charAt(3);
							v = "#" + r + r + g + g + b + b;
						}
						v = parseInt(v.substr(1), 16);
						a = [v >> 16, v >> 8 & 255, v & 255];
					} else if (v.substr(0, 3) === "hsl") {
						a = wasHSL = v.match(_numExp);
						if (!toHSL) {
							h = Number(a[0]) % 360 / 360;
							s = Number(a[1]) / 100;
							l = Number(a[2]) / 100;
							g = l <= 0.5 ? l * (s + 1) : l + s - l * s;
							r = l * 2 - g;
							if (a.length > 3) {
								a[3] = Number(v[3]);
							}
							a[0] = _hue(h + 1 / 3, r, g);
							a[1] = _hue(h, r, g);
							a[2] = _hue(h - 1 / 3, r, g);
						} else if (v.indexOf("=") !== -1) {
							//if relative values are found, just return the raw strings with the relative prefixes in place.
							return v.match(_relNumExp);
						}
					} else {
						a = v.match(_numExp) || _colorLookup.transparent;
					}
					a[0] = Number(a[0]);
					a[1] = Number(a[1]);
					a[2] = Number(a[2]);
					if (a.length > 3) {
						a[3] = Number(a[3]);
					}
				}
				if (toHSL && !wasHSL) {
					r = a[0] / 255;
					g = a[1] / 255;
					b = a[2] / 255;
					max = Math.max(r, g, b);
					min = Math.min(r, g, b);
					l = (max + min) / 2;
					if (max === min) {
						h = s = 0;
					} else {
						d = max - min;
						s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
						h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
						h *= 60;
					}
					a[0] = h + 0.5 | 0;
					a[1] = s * 100 + 0.5 | 0;
					a[2] = l * 100 + 0.5 | 0;
				}
				return a;
			},
			    _formatColors = function (s, toHSL) {
				var colors = s.match(_colorExp) || [],
				    charIndex = 0,
				    parsed = colors.length ? "" : s,
				    i,
				    color,
				    temp;
				for (i = 0; i < colors.length; i++) {
					color = colors[i];
					temp = s.substr(charIndex, s.indexOf(color, charIndex) - charIndex);
					charIndex += temp.length + color.length;
					color = _parseColor(color, toHSL);
					if (color.length === 3) {
						color.push(1);
					}
					parsed += temp + (toHSL ? "hsla(" + color[0] + "," + color[1] + "%," + color[2] + "%," + color[3] : "rgba(" + color.join(",")) + ")";
				}
				return parsed;
			},
			    _colorExp = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#.+?\\b"; //we'll dynamically build this Regular Expression to conserve file size. After building it, it will be able to find rgb(), rgba(), # (hexadecimal), and named color values like red, blue, purple, etc.

			for (p in _colorLookup) {
				_colorExp += "|" + p + "\\b";
			}
			_colorExp = new RegExp(_colorExp + ")", "gi");

			CSSPlugin.colorStringFilter = function (a) {
				var combined = a[0] + a[1],
				    toHSL;
				_colorExp.lastIndex = 0;
				if (_colorExp.test(combined)) {
					toHSL = combined.indexOf("hsl(") !== -1 || combined.indexOf("hsla(") !== -1;
					a[0] = _formatColors(a[0], toHSL);
					a[1] = _formatColors(a[1], toHSL);
				}
			};

			if (!TweenLite.defaultStringFilter) {
				TweenLite.defaultStringFilter = CSSPlugin.colorStringFilter;
			}

			/**
    * @private Returns a formatter function that handles taking a string (or number in some cases) and returning a consistently formatted one in terms of delimiters, quantity of values, etc. For example, we may get boxShadow values defined as "0px red" or "0px 0px 10px rgb(255,0,0)" or "0px 0px 20px 20px #F00" and we need to ensure that what we get back is described with 4 numbers and a color. This allows us to feed it into the _parseComplex() method and split the values up appropriately. The neat thing about this _getFormatter() function is that the dflt defines a pattern as well as a default, so for example, _getFormatter("0px 0px 0px 0px #777", true) not only sets the default as 0px for all distances and #777 for the color, but also sets the pattern such that 4 numbers and a color will always get returned.
    * @param {!string} dflt The default value and pattern to follow. So "0px 0px 0px 0px #777" will ensure that 4 numbers and a color will always get returned.
    * @param {boolean=} clr If true, the values should be searched for color-related data. For example, boxShadow values typically contain a color whereas borderRadius don't.
    * @param {boolean=} collapsible If true, the value is a top/left/right/bottom style one that acts like margin or padding, where if only one value is received, it's used for all 4; if 2 are received, the first is duplicated for 3rd (bottom) and the 2nd is duplicated for the 4th spot (left), etc.
    * @return {Function} formatter function
    */
			var _getFormatter = function (dflt, clr, collapsible, multi) {
				if (dflt == null) {
					return function (v) {
						return v;
					};
				}
				var dColor = clr ? (dflt.match(_colorExp) || [""])[0] : "",
				    dVals = dflt.split(dColor).join("").match(_valuesExp) || [],
				    pfx = dflt.substr(0, dflt.indexOf(dVals[0])),
				    sfx = dflt.charAt(dflt.length - 1) === ")" ? ")" : "",
				    delim = dflt.indexOf(" ") !== -1 ? " " : ",",
				    numVals = dVals.length,
				    dSfx = numVals > 0 ? dVals[0].replace(_numExp, "") : "",
				    formatter;
				if (!numVals) {
					return function (v) {
						return v;
					};
				}
				if (clr) {
					formatter = function (v) {
						var color, vals, i, a;
						if (typeof v === "number") {
							v += dSfx;
						} else if (multi && _commasOutsideParenExp.test(v)) {
							a = v.replace(_commasOutsideParenExp, "|").split("|");
							for (i = 0; i < a.length; i++) {
								a[i] = formatter(a[i]);
							}
							return a.join(",");
						}
						color = (v.match(_colorExp) || [dColor])[0];
						vals = v.split(color).join("").match(_valuesExp) || [];
						i = vals.length;
						if (numVals > i--) {
							while (++i < numVals) {
								vals[i] = collapsible ? vals[(i - 1) / 2 | 0] : dVals[i];
							}
						}
						return pfx + vals.join(delim) + delim + color + sfx + (v.indexOf("inset") !== -1 ? " inset" : "");
					};
					return formatter;
				}
				formatter = function (v) {
					var vals, a, i;
					if (typeof v === "number") {
						v += dSfx;
					} else if (multi && _commasOutsideParenExp.test(v)) {
						a = v.replace(_commasOutsideParenExp, "|").split("|");
						for (i = 0; i < a.length; i++) {
							a[i] = formatter(a[i]);
						}
						return a.join(",");
					}
					vals = v.match(_valuesExp) || [];
					i = vals.length;
					if (numVals > i--) {
						while (++i < numVals) {
							vals[i] = collapsible ? vals[(i - 1) / 2 | 0] : dVals[i];
						}
					}
					return pfx + vals.join(delim) + sfx;
				};
				return formatter;
			},


			/**
    * @private returns a formatter function that's used for edge-related values like marginTop, marginLeft, paddingBottom, paddingRight, etc. Just pass a comma-delimited list of property names related to the edges.
    * @param {!string} props a comma-delimited list of property names in order from top to left, like "marginTop,marginRight,marginBottom,marginLeft"
    * @return {Function} a formatter function
    */
			_getEdgeParser = function (props) {
				props = props.split(",");
				return function (t, e, p, cssp, pt, plugin, vars) {
					var a = (e + "").split(" "),
					    i;
					vars = {};
					for (i = 0; i < 4; i++) {
						vars[props[i]] = a[i] = a[i] || a[(i - 1) / 2 >> 0];
					}
					return cssp.parse(t, vars, pt, plugin);
				};
			},


			// @private used when other plugins must tween values first, like BezierPlugin or ThrowPropsPlugin, etc. That plugin's setRatio() gets called first so that the values are updated, and then we loop through the MiniPropTweens  which handle copying the values into their appropriate slots so that they can then be applied correctly in the main CSSPlugin setRatio() method. Remember, we typically create a proxy object that has a bunch of uniquely-named properties that we feed to the sub-plugin and it does its magic normally, and then we must interpret those values and apply them to the css because often numbers must get combined/concatenated, suffixes added, etc. to work with css, like boxShadow could have 4 values plus a color.
			_setPluginRatio = _internals._setPluginRatio = function (v) {
				this.plugin.setRatio(v);
				var d = this.data,
				    proxy = d.proxy,
				    mpt = d.firstMPT,
				    min = 0.000001,
				    val,
				    pt,
				    i,
				    str;
				while (mpt) {
					val = proxy[mpt.v];
					if (mpt.r) {
						val = Math.round(val);
					} else if (val < min && val > -min) {
						val = 0;
					}
					mpt.t[mpt.p] = val;
					mpt = mpt._next;
				}
				if (d.autoRotate) {
					d.autoRotate.rotation = proxy.rotation;
				}
				//at the end, we must set the CSSPropTween's "e" (end) value dynamically here because that's what is used in the final setRatio() method.
				if (v === 1) {
					mpt = d.firstMPT;
					while (mpt) {
						pt = mpt.t;
						if (!pt.type) {
							pt.e = pt.s + pt.xs0;
						} else if (pt.type === 1) {
							str = pt.xs0 + pt.s + pt.xs1;
							for (i = 1; i < pt.l; i++) {
								str += pt["xn" + i] + pt["xs" + (i + 1)];
							}
							pt.e = str;
						}
						mpt = mpt._next;
					}
				}
			},


			/**
    * @private @constructor Used by a few SpecialProps to hold important values for proxies. For example, _parseToProxy() creates a MiniPropTween instance for each property that must get tweened on the proxy, and we record the original property name as well as the unique one we create for the proxy, plus whether or not the value needs to be rounded plus the original value.
    * @param {!Object} t target object whose property we're tweening (often a CSSPropTween)
    * @param {!string} p property name
    * @param {(number|string|object)} v value
    * @param {MiniPropTween=} next next MiniPropTween in the linked list
    * @param {boolean=} r if true, the tweened value should be rounded to the nearest integer
    */
			MiniPropTween = function (t, p, v, next, r) {
				this.t = t;
				this.p = p;
				this.v = v;
				this.r = r;
				if (next) {
					next._prev = this;
					this._next = next;
				}
			},


			/**
    * @private Most other plugins (like BezierPlugin and ThrowPropsPlugin and others) can only tween numeric values, but CSSPlugin must accommodate special values that have a bunch of extra data (like a suffix or strings between numeric values, etc.). For example, boxShadow has values like "10px 10px 20px 30px rgb(255,0,0)" which would utterly confuse other plugins. This method allows us to split that data apart and grab only the numeric data and attach it to uniquely-named properties of a generic proxy object ({}) so that we can feed that to virtually any plugin to have the numbers tweened. However, we must also keep track of which properties from the proxy go with which CSSPropTween values and instances. So we create a linked list of MiniPropTweens. Each one records a target (the original CSSPropTween), property (like "s" or "xn1" or "xn2") that we're tweening and the unique property name that was used for the proxy (like "boxShadow_xn1" and "boxShadow_xn2") and whether or not they need to be rounded. That way, in the _setPluginRatio() method we can simply copy the values over from the proxy to the CSSPropTween instance(s). Then, when the main CSSPlugin setRatio() method runs and applies the CSSPropTween values accordingly, they're updated nicely. So the external plugin tweens the numbers, _setPluginRatio() copies them over, and setRatio() acts normally, applying css-specific values to the element.
    * This method returns an object that has the following properties:
    *  - proxy: a generic object containing the starting values for all the properties that will be tweened by the external plugin.  This is what we feed to the external _onInitTween() as the target
    *  - end: a generic object containing the ending values for all the properties that will be tweened by the external plugin. This is what we feed to the external plugin's _onInitTween() as the destination values
    *  - firstMPT: the first MiniPropTween in the linked list
    *  - pt: the first CSSPropTween in the linked list that was created when parsing. If shallow is true, this linked list will NOT attach to the one passed into the _parseToProxy() as the "pt" (4th) parameter.
    * @param {!Object} t target object to be tweened
    * @param {!(Object|string)} vars the object containing the information about the tweening values (typically the end/destination values) that should be parsed
    * @param {!CSSPlugin} cssp The CSSPlugin instance
    * @param {CSSPropTween=} pt the next CSSPropTween in the linked list
    * @param {TweenPlugin=} plugin the external TweenPlugin instance that will be handling tweening the numeric values
    * @param {boolean=} shallow if true, the resulting linked list from the parse will NOT be attached to the CSSPropTween that was passed in as the "pt" (4th) parameter.
    * @return An object containing the following properties: proxy, end, firstMPT, and pt (see above for descriptions)
    */
			_parseToProxy = _internals._parseToProxy = function (t, vars, cssp, pt, plugin, shallow) {
				var bpt = pt,
				    start = {},
				    end = {},
				    transform = cssp._transform,
				    oldForce = _forcePT,
				    i,
				    p,
				    xp,
				    mpt,
				    firstPT;
				cssp._transform = null;
				_forcePT = vars;
				pt = firstPT = cssp.parse(t, vars, pt, plugin);
				_forcePT = oldForce;
				//break off from the linked list so the new ones are isolated.
				if (shallow) {
					cssp._transform = transform;
					if (bpt) {
						bpt._prev = null;
						if (bpt._prev) {
							bpt._prev._next = null;
						}
					}
				}
				while (pt && pt !== bpt) {
					if (pt.type <= 1) {
						p = pt.p;
						end[p] = pt.s + pt.c;
						start[p] = pt.s;
						if (!shallow) {
							mpt = new MiniPropTween(pt, "s", p, mpt, pt.r);
							pt.c = 0;
						}
						if (pt.type === 1) {
							i = pt.l;
							while (--i > 0) {
								xp = "xn" + i;
								p = pt.p + "_" + xp;
								end[p] = pt.data[xp];
								start[p] = pt[xp];
								if (!shallow) {
									mpt = new MiniPropTween(pt, xp, p, mpt, pt.rxp[xp]);
								}
							}
						}
					}
					pt = pt._next;
				}
				return { proxy: start, end: end, firstMPT: mpt, pt: firstPT };
			},


			/**
    * @constructor Each property that is tweened has at least one CSSPropTween associated with it. These instances store important information like the target, property, starting value, amount of change, etc. They can also optionally have a number of "extra" strings and numeric values named xs1, xn1, xs2, xn2, xs3, xn3, etc. where "s" indicates string and "n" indicates number. These can be pieced together in a complex-value tween (type:1) that has alternating types of data like a string, number, string, number, etc. For example, boxShadow could be "5px 5px 8px rgb(102, 102, 51)". In that value, there are 6 numbers that may need to tween and then pieced back together into a string again with spaces, suffixes, etc. xs0 is special in that it stores the suffix for standard (type:0) tweens, -OR- the first string (prefix) in a complex-value (type:1) CSSPropTween -OR- it can be the non-tweening value in a type:-1 CSSPropTween. We do this to conserve memory.
    * CSSPropTweens have the following optional properties as well (not defined through the constructor):
    *  - l: Length in terms of the number of extra properties that the CSSPropTween has (default: 0). For example, for a boxShadow we may need to tween 5 numbers in which case l would be 5; Keep in mind that the start/end values for the first number that's tweened are always stored in the s and c properties to conserve memory. All additional values thereafter are stored in xn1, xn2, etc.
    *  - xfirst: The first instance of any sub-CSSPropTweens that are tweening properties of this instance. For example, we may split up a boxShadow tween so that there's a main CSSPropTween of type:1 that has various xs* and xn* values associated with the h-shadow, v-shadow, blur, color, etc. Then we spawn a CSSPropTween for each of those that has a higher priority and runs BEFORE the main CSSPropTween so that the values are all set by the time it needs to re-assemble them. The xfirst gives us an easy way to identify the first one in that chain which typically ends at the main one (because they're all prepende to the linked list)
    *  - plugin: The TweenPlugin instance that will handle the tweening of any complex values. For example, sometimes we don't want to use normal subtweens (like xfirst refers to) to tween the values - we might want ThrowPropsPlugin or BezierPlugin some other plugin to do the actual tweening, so we create a plugin instance and store a reference here. We need this reference so that if we get a request to round values or disable a tween, we can pass along that request.
    *  - data: Arbitrary data that needs to be stored with the CSSPropTween. Typically if we're going to have a plugin handle the tweening of a complex-value tween, we create a generic object that stores the END values that we're tweening to and the CSSPropTween's xs1, xs2, etc. have the starting values. We store that object as data. That way, we can simply pass that object to the plugin and use the CSSPropTween as the target.
    *  - setRatio: Only used for type:2 tweens that require custom functionality. In this case, we call the CSSPropTween's setRatio() method and pass the ratio each time the tween updates. This isn't quite as efficient as doing things directly in the CSSPlugin's setRatio() method, but it's very convenient and flexible.
    * @param {!Object} t Target object whose property will be tweened. Often a DOM element, but not always. It could be anything.
    * @param {string} p Property to tween (name). For example, to tween element.width, p would be "width".
    * @param {number} s Starting numeric value
    * @param {number} c Change in numeric value over the course of the entire tween. For example, if element.width starts at 5 and should end at 100, c would be 95.
    * @param {CSSPropTween=} next The next CSSPropTween in the linked list. If one is defined, we will define its _prev as the new instance, and the new instance's _next will be pointed at it.
    * @param {number=} type The type of CSSPropTween where -1 = a non-tweening value, 0 = a standard simple tween, 1 = a complex value (like one that has multiple numbers in a comma- or space-delimited string like border:"1px solid red"), and 2 = one that uses a custom setRatio function that does all of the work of applying the values on each update.
    * @param {string=} n Name of the property that should be used for overwriting purposes which is typically the same as p but not always. For example, we may need to create a subtween for the 2nd part of a "clip:rect(...)" tween in which case "p" might be xs1 but "n" is still "clip"
    * @param {boolean=} r If true, the value(s) should be rounded
    * @param {number=} pr Priority in the linked list order. Higher priority CSSPropTweens will be updated before lower priority ones. The default priority is 0.
    * @param {string=} b Beginning value. We store this to ensure that it is EXACTLY what it was when the tween began without any risk of interpretation issues.
    * @param {string=} e Ending value. We store this to ensure that it is EXACTLY what the user defined at the end of the tween without any risk of interpretation issues.
    */
			CSSPropTween = _internals.CSSPropTween = function (t, p, s, c, next, type, n, r, pr, b, e) {
				this.t = t; //target
				this.p = p; //property
				this.s = s; //starting value
				this.c = c; //change value
				this.n = n || p; //name that this CSSPropTween should be associated to (usually the same as p, but not always - n is what overwriting looks at)
				if (!(t instanceof CSSPropTween)) {
					_overwriteProps.push(this.n);
				}
				this.r = r; //round (boolean)
				this.type = type || 0; //0 = normal tween, -1 = non-tweening (in which case xs0 will be applied to the target's property, like tp.t[tp.p] = tp.xs0), 1 = complex-value SpecialProp, 2 = custom setRatio() that does all the work
				if (pr) {
					this.pr = pr;
					_hasPriority = true;
				}
				this.b = b === undefined ? s : b;
				this.e = e === undefined ? s + c : e;
				if (next) {
					this._next = next;
					next._prev = this;
				}
			},
			    _addNonTweeningNumericPT = function (target, prop, start, end, next, overwriteProp) {
				//cleans up some code redundancies and helps minification. Just a fast way to add a NUMERIC non-tweening CSSPropTween
				var pt = new CSSPropTween(target, prop, start, end - start, next, -1, overwriteProp);
				pt.b = start;
				pt.e = pt.xs0 = end;
				return pt;
			},


			/**
    * Takes a target, the beginning value and ending value (as strings) and parses them into a CSSPropTween (possibly with child CSSPropTweens) that accommodates multiple numbers, colors, comma-delimited values, etc. For example:
    * sp.parseComplex(element, "boxShadow", "5px 10px 20px rgb(255,102,51)", "0px 0px 0px red", true, "0px 0px 0px rgb(0,0,0,0)", pt);
    * It will walk through the beginning and ending values (which should be in the same format with the same number and type of values) and figure out which parts are numbers, what strings separate the numeric/tweenable values, and then create the CSSPropTweens accordingly. If a plugin is defined, no child CSSPropTweens will be created. Instead, the ending values will be stored in the "data" property of the returned CSSPropTween like: {s:-5, xn1:-10, xn2:-20, xn3:255, xn4:0, xn5:0} so that it can be fed to any other plugin and it'll be plain numeric tweens but the recomposition of the complex value will be handled inside CSSPlugin's setRatio().
    * If a setRatio is defined, the type of the CSSPropTween will be set to 2 and recomposition of the values will be the responsibility of that method.
    *
    * @param {!Object} t Target whose property will be tweened
    * @param {!string} p Property that will be tweened (its name, like "left" or "backgroundColor" or "boxShadow")
    * @param {string} b Beginning value
    * @param {string} e Ending value
    * @param {boolean} clrs If true, the value could contain a color value like "rgb(255,0,0)" or "#F00" or "red". The default is false, so no colors will be recognized (a performance optimization)
    * @param {(string|number|Object)} dflt The default beginning value that should be used if no valid beginning value is defined or if the number of values inside the complex beginning and ending values don't match
    * @param {?CSSPropTween} pt CSSPropTween instance that is the current head of the linked list (we'll prepend to this).
    * @param {number=} pr Priority in the linked list order. Higher priority properties will be updated before lower priority ones. The default priority is 0.
    * @param {TweenPlugin=} plugin If a plugin should handle the tweening of extra properties, pass the plugin instance here. If one is defined, then NO subtweens will be created for any extra properties (the properties will be created - just not additional CSSPropTween instances to tween them) because the plugin is expected to do so. However, the end values WILL be populated in the "data" property, like {s:100, xn1:50, xn2:300}
    * @param {function(number)=} setRatio If values should be set in a custom function instead of being pieced together in a type:1 (complex-value) CSSPropTween, define that custom function here.
    * @return {CSSPropTween} The first CSSPropTween in the linked list which includes the new one(s) added by the parseComplex() call.
    */
			_parseComplex = CSSPlugin.parseComplex = function (t, p, b, e, clrs, dflt, pt, pr, plugin, setRatio) {
				//DEBUG: _log("parseComplex: "+p+", b: "+b+", e: "+e);
				b = b || dflt || "";
				pt = new CSSPropTween(t, p, 0, 0, pt, setRatio ? 2 : 1, null, false, pr, b, e);
				e += ""; //ensures it's a string
				var ba = b.split(", ").join(",").split(" "),
				    //beginning array
				ea = e.split(", ").join(",").split(" "),
				    //ending array
				l = ba.length,
				    autoRound = _autoRound !== false,
				    i,
				    xi,
				    ni,
				    bv,
				    ev,
				    bnums,
				    enums,
				    bn,
				    hasAlpha,
				    temp,
				    cv,
				    str,
				    useHSL;
				if (e.indexOf(",") !== -1 || b.indexOf(",") !== -1) {
					ba = ba.join(" ").replace(_commasOutsideParenExp, ", ").split(" ");
					ea = ea.join(" ").replace(_commasOutsideParenExp, ", ").split(" ");
					l = ba.length;
				}
				if (l !== ea.length) {
					//DEBUG: _log("mismatched formatting detected on " + p + " (" + b + " vs " + e + ")");
					ba = (dflt || "").split(" ");
					l = ba.length;
				}
				pt.plugin = plugin;
				pt.setRatio = setRatio;
				_colorExp.lastIndex = 0;
				for (i = 0; i < l; i++) {
					bv = ba[i];
					ev = ea[i];
					bn = parseFloat(bv);
					//if the value begins with a number (most common). It's fine if it has a suffix like px
					if (bn || bn === 0) {
						pt.appendXtra("", bn, _parseChange(ev, bn), ev.replace(_relNumExp, ""), autoRound && ev.indexOf("px") !== -1, true);

						//if the value is a color
					} else if (clrs && _colorExp.test(bv)) {
						str = ev.charAt(ev.length - 1) === "," ? ")," : ")"; //if there's a comma at the end, retain it.
						useHSL = ev.indexOf("hsl") !== -1 && _supportsOpacity;
						bv = _parseColor(bv, useHSL);
						ev = _parseColor(ev, useHSL);
						hasAlpha = bv.length + ev.length > 6;
						if (hasAlpha && !_supportsOpacity && ev[3] === 0) {
							//older versions of IE don't support rgba(), so if the destination alpha is 0, just use "transparent" for the end color
							pt["xs" + pt.l] += pt.l ? " transparent" : "transparent";
							pt.e = pt.e.split(ea[i]).join("transparent");
						} else {
							if (!_supportsOpacity) {
								//old versions of IE don't support rgba().
								hasAlpha = false;
							}
							if (useHSL) {
								pt.appendXtra(hasAlpha ? "hsla(" : "hsl(", bv[0], _parseChange(ev[0], bv[0]), ",", false, true).appendXtra("", bv[1], _parseChange(ev[1], bv[1]), "%,", false).appendXtra("", bv[2], _parseChange(ev[2], bv[2]), hasAlpha ? "%," : "%" + str, false);
							} else {
								pt.appendXtra(hasAlpha ? "rgba(" : "rgb(", bv[0], ev[0] - bv[0], ",", true, true).appendXtra("", bv[1], ev[1] - bv[1], ",", true).appendXtra("", bv[2], ev[2] - bv[2], hasAlpha ? "," : str, true);
							}

							if (hasAlpha) {
								bv = bv.length < 4 ? 1 : bv[3];
								pt.appendXtra("", bv, (ev.length < 4 ? 1 : ev[3]) - bv, str, false);
							}
						}
						_colorExp.lastIndex = 0; //otherwise the test() on the RegExp could move the lastIndex and taint future results.
					} else {
						bnums = bv.match(_numExp); //gets each group of numbers in the beginning value string and drops them into an array

						//if no number is found, treat it as a non-tweening value and just append the string to the current xs.
						if (!bnums) {
							pt["xs" + pt.l] += pt.l ? " " + bv : bv;

							//loop through all the numbers that are found and construct the extra values on the pt.
						} else {
							enums = ev.match(_relNumExp); //get each group of numbers in the end value string and drop them into an array. We allow relative values too, like +=50 or -=.5
							if (!enums || enums.length !== bnums.length) {
								//DEBUG: _log("mismatched formatting detected on " + p + " (" + b + " vs " + e + ")");
								return pt;
							}
							ni = 0;
							for (xi = 0; xi < bnums.length; xi++) {
								cv = bnums[xi];
								temp = bv.indexOf(cv, ni);
								pt.appendXtra(bv.substr(ni, temp - ni), Number(cv), _parseChange(enums[xi], cv), "", autoRound && bv.substr(temp + cv.length, 2) === "px", xi === 0);
								ni = temp + cv.length;
							}
							pt["xs" + pt.l] += bv.substr(ni);
						}
					}
				}
				//if there are relative values ("+=" or "-=" prefix), we need to adjust the ending value to eliminate the prefixes and combine the values properly.
				if (e.indexOf("=") !== -1) if (pt.data) {
					str = pt.xs0 + pt.data.s;
					for (i = 1; i < pt.l; i++) {
						str += pt["xs" + i] + pt.data["xn" + i];
					}
					pt.e = str + pt["xs" + i];
				}
				if (!pt.l) {
					pt.type = -1;
					pt.xs0 = pt.e;
				}
				return pt.xfirst || pt;
			},
			    i = 9;

			p = CSSPropTween.prototype;
			p.l = p.pr = 0; //length (number of extra properties like xn1, xn2, xn3, etc.
			while (--i > 0) {
				p["xn" + i] = 0;
				p["xs" + i] = "";
			}
			p.xs0 = "";
			p._next = p._prev = p.xfirst = p.data = p.plugin = p.setRatio = p.rxp = null;

			/**
    * Appends and extra tweening value to a CSSPropTween and automatically manages any prefix and suffix strings. The first extra value is stored in the s and c of the main CSSPropTween instance, but thereafter any extras are stored in the xn1, xn2, xn3, etc. The prefixes and suffixes are stored in the xs0, xs1, xs2, etc. properties. For example, if I walk through a clip value like "rect(10px, 5px, 0px, 20px)", the values would be stored like this:
    * xs0:"rect(", s:10, xs1:"px, ", xn1:5, xs2:"px, ", xn2:0, xs3:"px, ", xn3:20, xn4:"px)"
    * And they'd all get joined together when the CSSPlugin renders (in the setRatio() method).
    * @param {string=} pfx Prefix (if any)
    * @param {!number} s Starting value
    * @param {!number} c Change in numeric value over the course of the entire tween. For example, if the start is 5 and the end is 100, the change would be 95.
    * @param {string=} sfx Suffix (if any)
    * @param {boolean=} r Round (if true).
    * @param {boolean=} pad If true, this extra value should be separated by the previous one by a space. If there is no previous extra and pad is true, it will automatically drop the space.
    * @return {CSSPropTween} returns itself so that multiple methods can be chained together.
    */
			p.appendXtra = function (pfx, s, c, sfx, r, pad) {
				var pt = this,
				    l = pt.l;
				pt["xs" + l] += pad && l ? " " + pfx : pfx || "";
				if (!c) if (l !== 0 && !pt.plugin) {
					//typically we'll combine non-changing values right into the xs to optimize performance, but we don't combine them when there's a plugin that will be tweening the values because it may depend on the values being split apart, like for a bezier, if a value doesn't change between the first and second iteration but then it does on the 3rd, we'll run into trouble because there's no xn slot for that value!
					pt["xs" + l] += s + (sfx || "");
					return pt;
				}
				pt.l++;
				pt.type = pt.setRatio ? 2 : 1;
				pt["xs" + pt.l] = sfx || "";
				if (l > 0) {
					pt.data["xn" + l] = s + c;
					pt.rxp["xn" + l] = r; //round extra property (we need to tap into this in the _parseToProxy() method)
					pt["xn" + l] = s;
					if (!pt.plugin) {
						pt.xfirst = new CSSPropTween(pt, "xn" + l, s, c, pt.xfirst || pt, 0, pt.n, r, pt.pr);
						pt.xfirst.xs0 = 0; //just to ensure that the property stays numeric which helps modern browsers speed up processing. Remember, in the setRatio() method, we do pt.t[pt.p] = val + pt.xs0 so if pt.xs0 is "" (the default), it'll cast the end value as a string. When a property is a number sometimes and a string sometimes, it prevents the compiler from locking in the data type, slowing things down slightly.
					}
					return pt;
				}
				pt.data = { s: s + c };
				pt.rxp = {};
				pt.s = s;
				pt.c = c;
				pt.r = r;
				return pt;
			};

			/**
    * @constructor A SpecialProp is basically a css property that needs to be treated in a non-standard way, like if it may contain a complex value like boxShadow:"5px 10px 15px rgb(255, 102, 51)" or if it is associated with another plugin like ThrowPropsPlugin or BezierPlugin. Every SpecialProp is associated with a particular property name like "boxShadow" or "throwProps" or "bezier" and it will intercept those values in the vars object that's passed to the CSSPlugin and handle them accordingly.
    * @param {!string} p Property name (like "boxShadow" or "throwProps")
    * @param {Object=} options An object containing any of the following configuration options:
    *                      - defaultValue: the default value
    *                      - parser: A function that should be called when the associated property name is found in the vars. This function should return a CSSPropTween instance and it should ensure that it is properly inserted into the linked list. It will receive 4 paramters: 1) The target, 2) The value defined in the vars, 3) The CSSPlugin instance (whose _firstPT should be used for the linked list), and 4) A computed style object if one was calculated (this is a speed optimization that allows retrieval of starting values quicker)
    *                      - formatter: a function that formats any value received for this special property (for example, boxShadow could take "5px 5px red" and format it to "5px 5px 0px 0px red" so that both the beginning and ending values have a common order and quantity of values.)
    *                      - prefix: if true, we'll determine whether or not this property requires a vendor prefix (like Webkit or Moz or ms or O)
    *                      - color: set this to true if the value for this SpecialProp may contain color-related values like rgb(), rgba(), etc.
    *                      - priority: priority in the linked list order. Higher priority SpecialProps will be updated before lower priority ones. The default priority is 0.
    *                      - multi: if true, the formatter should accommodate a comma-delimited list of values, like boxShadow could have multiple boxShadows listed out.
    *                      - collapsible: if true, the formatter should treat the value like it's a top/right/bottom/left value that could be collapsed, like "5px" would apply to all, "5px, 10px" would use 5px for top/bottom and 10px for right/left, etc.
    *                      - keyword: a special keyword that can [optionally] be found inside the value (like "inset" for boxShadow). This allows us to validate beginning/ending values to make sure they match (if the keyword is found in one, it'll be added to the other for consistency by default).
    */
			var SpecialProp = function (p, options) {
				options = options || {};
				this.p = options.prefix ? _checkPropPrefix(p) || p : p;
				_specialProps[p] = _specialProps[this.p] = this;
				this.format = options.formatter || _getFormatter(options.defaultValue, options.color, options.collapsible, options.multi);
				if (options.parser) {
					this.parse = options.parser;
				}
				this.clrs = options.color;
				this.multi = options.multi;
				this.keyword = options.keyword;
				this.dflt = options.defaultValue;
				this.pr = options.priority || 0;
			},


			//shortcut for creating a new SpecialProp that can accept multiple properties as a comma-delimited list (helps minification). dflt can be an array for multiple values (we don't do a comma-delimited list because the default value may contain commas, like rect(0px,0px,0px,0px)). We attach this method to the SpecialProp class/object instead of using a private _createSpecialProp() method so that we can tap into it externally if necessary, like from another plugin.
			_registerComplexSpecialProp = _internals._registerComplexSpecialProp = function (p, options, defaults) {
				if (typeof options !== "object") {
					options = { parser: defaults }; //to make backwards compatible with older versions of BezierPlugin and ThrowPropsPlugin
				}
				var a = p.split(","),
				    d = options.defaultValue,
				    i,
				    temp;
				defaults = defaults || [d];
				for (i = 0; i < a.length; i++) {
					options.prefix = i === 0 && options.prefix;
					options.defaultValue = defaults[i] || d;
					temp = new SpecialProp(a[i], options);
				}
			},


			//creates a placeholder special prop for a plugin so that the property gets caught the first time a tween of it is attempted, and at that time it makes the plugin register itself, thus taking over for all future tweens of that property. This allows us to not mandate that things load in a particular order and it also allows us to log() an error that informs the user when they attempt to tween an external plugin-related property without loading its .js file.
			_registerPluginProp = function (p) {
				if (!_specialProps[p]) {
					var pluginName = p.charAt(0).toUpperCase() + p.substr(1) + "Plugin";
					_registerComplexSpecialProp(p, { parser: function (t, e, p, cssp, pt, plugin, vars) {
							var pluginClass = _globals.com.greensock.plugins[pluginName];
							if (!pluginClass) {
								_log("Error: " + pluginName + " js file not loaded.");
								return pt;
							}
							pluginClass._cssRegister();
							return _specialProps[p].parse(t, e, p, cssp, pt, plugin, vars);
						} });
				}
			};

			p = SpecialProp.prototype;

			/**
    * Alias for _parseComplex() that automatically plugs in certain values for this SpecialProp, like its property name, whether or not colors should be sensed, the default value, and priority. It also looks for any keyword that the SpecialProp defines (like "inset" for boxShadow) and ensures that the beginning and ending values have the same number of values for SpecialProps where multi is true (like boxShadow and textShadow can have a comma-delimited list)
    * @param {!Object} t target element
    * @param {(string|number|object)} b beginning value
    * @param {(string|number|object)} e ending (destination) value
    * @param {CSSPropTween=} pt next CSSPropTween in the linked list
    * @param {TweenPlugin=} plugin If another plugin will be tweening the complex value, that TweenPlugin instance goes here.
    * @param {function=} setRatio If a custom setRatio() method should be used to handle this complex value, that goes here.
    * @return {CSSPropTween=} First CSSPropTween in the linked list
    */
			p.parseComplex = function (t, b, e, pt, plugin, setRatio) {
				var kwd = this.keyword,
				    i,
				    ba,
				    ea,
				    l,
				    bi,
				    ei;
				//if this SpecialProp's value can contain a comma-delimited list of values (like boxShadow or textShadow), we must parse them in a special way, and look for a keyword (like "inset" for boxShadow) and ensure that the beginning and ending BOTH have it if the end defines it as such. We also must ensure that there are an equal number of values specified (we can't tween 1 boxShadow to 3 for example)
				if (this.multi) if (_commasOutsideParenExp.test(e) || _commasOutsideParenExp.test(b)) {
					ba = b.replace(_commasOutsideParenExp, "|").split("|");
					ea = e.replace(_commasOutsideParenExp, "|").split("|");
				} else if (kwd) {
					ba = [b];
					ea = [e];
				}
				if (ea) {
					l = ea.length > ba.length ? ea.length : ba.length;
					for (i = 0; i < l; i++) {
						b = ba[i] = ba[i] || this.dflt;
						e = ea[i] = ea[i] || this.dflt;
						if (kwd) {
							bi = b.indexOf(kwd);
							ei = e.indexOf(kwd);
							if (bi !== ei) {
								if (ei === -1) {
									//if the keyword isn't in the end value, remove it from the beginning one.
									ba[i] = ba[i].split(kwd).join("");
								} else if (bi === -1) {
									//if the keyword isn't in the beginning, add it.
									ba[i] += " " + kwd;
								}
							}
						}
					}
					b = ba.join(", ");
					e = ea.join(", ");
				}
				return _parseComplex(t, this.p, b, e, this.clrs, this.dflt, pt, this.pr, plugin, setRatio);
			};

			/**
    * Accepts a target and end value and spits back a CSSPropTween that has been inserted into the CSSPlugin's linked list and conforms with all the conventions we use internally, like type:-1, 0, 1, or 2, setting up any extra property tweens, priority, etc. For example, if we have a boxShadow SpecialProp and call:
    * this._firstPT = sp.parse(element, "5px 10px 20px rgb(2550,102,51)", "boxShadow", this);
    * It should figure out the starting value of the element's boxShadow, compare it to the provided end value and create all the necessary CSSPropTweens of the appropriate types to tween the boxShadow. The CSSPropTween that gets spit back should already be inserted into the linked list (the 4th parameter is the current head, so prepend to that).
    * @param {!Object} t Target object whose property is being tweened
    * @param {Object} e End value as provided in the vars object (typically a string, but not always - like a throwProps would be an object).
    * @param {!string} p Property name
    * @param {!CSSPlugin} cssp The CSSPlugin instance that should be associated with this tween.
    * @param {?CSSPropTween} pt The CSSPropTween that is the current head of the linked list (we'll prepend to it)
    * @param {TweenPlugin=} plugin If a plugin will be used to tween the parsed value, this is the plugin instance.
    * @param {Object=} vars Original vars object that contains the data for parsing.
    * @return {CSSPropTween} The first CSSPropTween in the linked list which includes the new one(s) added by the parse() call.
    */
			p.parse = function (t, e, p, cssp, pt, plugin, vars) {
				return this.parseComplex(t.style, this.format(_getStyle(t, this.p, _cs, false, this.dflt)), this.format(e), pt, plugin);
			};

			/**
    * Registers a special property that should be intercepted from any "css" objects defined in tweens. This allows you to handle them however you want without CSSPlugin doing it for you. The 2nd parameter should be a function that accepts 3 parameters:
    *  1) Target object whose property should be tweened (typically a DOM element)
    *  2) The end/destination value (could be a string, number, object, or whatever you want)
    *  3) The tween instance (you probably don't need to worry about this, but it can be useful for looking up information like the duration)
    *
    * Then, your function should return a function which will be called each time the tween gets rendered, passing a numeric "ratio" parameter to your function that indicates the change factor (usually between 0 and 1). For example:
    *
    * CSSPlugin.registerSpecialProp("myCustomProp", function(target, value, tween) {
    *      var start = target.style.width;
    *      return function(ratio) {
    *              target.style.width = (start + value * ratio) + "px";
    *              console.log("set width to " + target.style.width);
    *          }
    * }, 0);
    *
    * Then, when I do this tween, it will trigger my special property:
    *
    * TweenLite.to(element, 1, {css:{myCustomProp:100}});
    *
    * In the example, of course, we're just changing the width, but you can do anything you want.
    *
    * @param {!string} name Property name (or comma-delimited list of property names) that should be intercepted and handled by your function. For example, if I define "myCustomProp", then it would handle that portion of the following tween: TweenLite.to(element, 1, {css:{myCustomProp:100}})
    * @param {!function(Object, Object, Object, string):function(number)} onInitTween The function that will be called when a tween of this special property is performed. The function will receive 4 parameters: 1) Target object that should be tweened, 2) Value that was passed to the tween, 3) The tween instance itself (rarely used), and 4) The property name that's being tweened. Your function should return a function that should be called on every update of the tween. That function will receive a single parameter that is a "change factor" value (typically between 0 and 1) indicating the amount of change as a ratio. You can use this to determine how to set the values appropriately in your function.
    * @param {number=} priority Priority that helps the engine determine the order in which to set the properties (default: 0). Higher priority properties will be updated before lower priority ones.
    */
			CSSPlugin.registerSpecialProp = function (name, onInitTween, priority) {
				_registerComplexSpecialProp(name, { parser: function (t, e, p, cssp, pt, plugin, vars) {
						var rv = new CSSPropTween(t, p, 0, 0, pt, 2, p, false, priority);
						rv.plugin = plugin;
						rv.setRatio = onInitTween(t, e, cssp._tween, p);
						return rv;
					}, priority: priority });
			};

			//transform-related methods and properties
			CSSPlugin.useSVGTransformAttr = _isSafari || _isFirefox; //Safari and Firefox both have some rendering bugs when applying CSS transforms to SVG elements, so default to using the "transform" attribute instead (users can override this).
			var _transformProps = "scaleX,scaleY,scaleZ,x,y,z,skewX,skewY,rotation,rotationX,rotationY,perspective,xPercent,yPercent".split(","),
			    _transformProp = _checkPropPrefix("transform"),
			    //the Javascript (camelCase) transform property, like msTransform, WebkitTransform, MozTransform, or OTransform.
			_transformPropCSS = _prefixCSS + "transform",
			    _transformOriginProp = _checkPropPrefix("transformOrigin"),
			    _supports3D = _checkPropPrefix("perspective") !== null,
			    Transform = _internals.Transform = function () {
				this.perspective = parseFloat(CSSPlugin.defaultTransformPerspective) || 0;
				this.force3D = CSSPlugin.defaultForce3D === false || !_supports3D ? false : CSSPlugin.defaultForce3D || "auto";
			},
			    _SVGElement = window.SVGElement,
			    _useSVGTransformAttr,

			//Some browsers (like Firefox and IE) don't honor transform-origin properly in SVG elements, so we need to manually adjust the matrix accordingly. We feature detect here rather than always doing the conversion for certain browsers because they may fix the problem at some point in the future.

			_createSVG = function (type, container, attributes) {
				var element = _doc.createElementNS("http://www.w3.org/2000/svg", type),
				    reg = /([a-z])([A-Z])/g,
				    p;
				for (p in attributes) {
					element.setAttributeNS(null, p.replace(reg, "$1-$2").toLowerCase(), attributes[p]);
				}
				container.appendChild(element);
				return element;
			},
			    _docElement = _doc.documentElement,
			    _forceSVGTransformAttr = function () {
				//IE and Android stock don't support CSS transforms on SVG elements, so we must write them to the "transform" attribute. We populate this variable in the _parseTransform() method, and only if/when we come across an SVG element
				var force = _ieVers || /Android/i.test(_agent) && !window.chrome,
				    svg,
				    rect,
				    width;
				if (_doc.createElementNS && !force) {
					//IE8 and earlier doesn't support SVG anyway
					svg = _createSVG("svg", _docElement);
					rect = _createSVG("rect", svg, { width: 100, height: 50, x: 100 });
					width = rect.getBoundingClientRect().width;
					rect.style[_transformOriginProp] = "50% 50%";
					rect.style[_transformProp] = "scaleX(0.5)";
					force = width === rect.getBoundingClientRect().width && !(_isFirefox && _supports3D); //note: Firefox fails the test even though it does support CSS transforms in 3D. Since we can't push 3D stuff into the transform attribute, we force Firefox to pass the test here (as long as it does truly support 3D).
					_docElement.removeChild(svg);
				}
				return force;
			}(),
			    _parseSVGOrigin = function (e, local, decoratee, absolute, smoothOrigin) {
				var tm = e._gsTransform,
				    m = _getMatrix(e, true),
				    v,
				    x,
				    y,
				    xOrigin,
				    yOrigin,
				    a,
				    b,
				    c,
				    d,
				    tx,
				    ty,
				    determinant,
				    xOriginOld,
				    yOriginOld;
				if (tm) {
					xOriginOld = tm.xOrigin; //record the original values before we alter them.
					yOriginOld = tm.yOrigin;
				}
				if (!absolute || (v = absolute.split(" ")).length < 2) {
					b = e.getBBox();
					local = _parsePosition(local).split(" ");
					v = [(local[0].indexOf("%") !== -1 ? parseFloat(local[0]) / 100 * b.width : parseFloat(local[0])) + b.x, (local[1].indexOf("%") !== -1 ? parseFloat(local[1]) / 100 * b.height : parseFloat(local[1])) + b.y];
				}
				decoratee.xOrigin = xOrigin = parseFloat(v[0]);
				decoratee.yOrigin = yOrigin = parseFloat(v[1]);
				if (absolute && m !== _identity2DMatrix) {
					//if svgOrigin is being set, we must invert the matrix and determine where the absolute point is, factoring in the current transforms. Otherwise, the svgOrigin would be based on the element's non-transformed position on the canvas.
					a = m[0];
					b = m[1];
					c = m[2];
					d = m[3];
					tx = m[4];
					ty = m[5];
					determinant = a * d - b * c;
					x = xOrigin * (d / determinant) + yOrigin * (-c / determinant) + (c * ty - d * tx) / determinant;
					y = xOrigin * (-b / determinant) + yOrigin * (a / determinant) - (a * ty - b * tx) / determinant;
					xOrigin = decoratee.xOrigin = v[0] = x;
					yOrigin = decoratee.yOrigin = v[1] = y;
				}
				if (tm) {
					//avoid jump when transformOrigin is changed - adjust the x/y values accordingly
					if (smoothOrigin || smoothOrigin !== false && CSSPlugin.defaultSmoothOrigin !== false) {
						x = xOrigin - xOriginOld;
						y = yOrigin - yOriginOld;
						//originally, we simply adjusted the x and y values, but that would cause problems if, for example, you created a rotational tween part-way through an x/y tween. Managing the offset in a separate variable gives us ultimate flexibility.
						//tm.x -= x - (x * m[0] + y * m[2]);
						//tm.y -= y - (x * m[1] + y * m[3]);
						tm.xOffset += x * m[0] + y * m[2] - x;
						tm.yOffset += x * m[1] + y * m[3] - y;
					} else {
						tm.xOffset = tm.yOffset = 0;
					}
				}
				e.setAttribute("data-svg-origin", v.join(" "));
			},
			    _isSVG = function (e) {
				return !!(_SVGElement && typeof e.getBBox === "function" && e.getCTM && (!e.parentNode || e.parentNode.getBBox && e.parentNode.getCTM));
			},
			    _identity2DMatrix = [1, 0, 0, 1, 0, 0],
			    _getMatrix = function (e, force2D) {
				var tm = e._gsTransform || new Transform(),
				    rnd = 100000,
				    isDefault,
				    s,
				    m,
				    n,
				    dec;
				if (_transformProp) {
					s = _getStyle(e, _transformPropCSS, null, true);
				} else if (e.currentStyle) {
					//for older versions of IE, we need to interpret the filter portion that is in the format: progid:DXImageTransform.Microsoft.Matrix(M11=6.123233995736766e-17, M12=-1, M21=1, M22=6.123233995736766e-17, sizingMethod='auto expand') Notice that we need to swap b and c compared to a normal matrix.
					s = e.currentStyle.filter.match(_ieGetMatrixExp);
					s = s && s.length === 4 ? [s[0].substr(4), Number(s[2].substr(4)), Number(s[1].substr(4)), s[3].substr(4), tm.x || 0, tm.y || 0].join(",") : "";
				}
				isDefault = !s || s === "none" || s === "matrix(1, 0, 0, 1, 0, 0)";
				if (tm.svg || e.getBBox && _isSVG(e)) {
					if (isDefault && (e.style[_transformProp] + "").indexOf("matrix") !== -1) {
						//some browsers (like Chrome 40) don't correctly report transforms that are applied inline on an SVG element (they don't get included in the computed style), so we double-check here and accept matrix values
						s = e.style[_transformProp];
						isDefault = 0;
					}
					m = e.getAttribute("transform");
					if (isDefault && m) {
						if (m.indexOf("matrix") !== -1) {
							//just in case there's a "transform" value specified as an attribute instead of CSS style. Accept either a matrix() or simple translate() value though.
							s = m;
							isDefault = 0;
						} else if (m.indexOf("translate") !== -1) {
							s = "matrix(1,0,0,1," + m.match(/(?:\-|\b)[\d\-\.e]+\b/gi).join(",") + ")";
							isDefault = 0;
						}
					}
				}
				if (isDefault) {
					return _identity2DMatrix;
				}
				//split the matrix values out into an array (m for matrix)
				m = (s || "").match(/(?:\-|\b)[\d\-\.e]+\b/gi) || [];
				i = m.length;
				while (--i > -1) {
					n = Number(m[i]);
					m[i] = (dec = n - (n |= 0)) ? (dec * rnd + (dec < 0 ? -0.5 : 0.5) | 0) / rnd + n : n; //convert strings to Numbers and round to 5 decimal places to avoid issues with tiny numbers. Roughly 20x faster than Number.toFixed(). We also must make sure to round before dividing so that values like 0.9999999999 become 1 to avoid glitches in browser rendering and interpretation of flipped/rotated 3D matrices. And don't just multiply the number by rnd, floor it, and then divide by rnd because the bitwise operations max out at a 32-bit signed integer, thus it could get clipped at a relatively low value (like 22,000.00000 for example).
				}
				return force2D && m.length > 6 ? [m[0], m[1], m[4], m[5], m[12], m[13]] : m;
			},


			/**
    * Parses the transform values for an element, returning an object with x, y, z, scaleX, scaleY, scaleZ, rotation, rotationX, rotationY, skewX, and skewY properties. Note: by default (for performance reasons), all skewing is combined into skewX and rotation but skewY still has a place in the transform object so that we can record how much of the skew is attributed to skewX vs skewY. Remember, a skewY of 10 looks the same as a rotation of 10 and skewX of -10.
    * @param {!Object} t target element
    * @param {Object=} cs computed style object (optional)
    * @param {boolean=} rec if true, the transform values will be recorded to the target element's _gsTransform object, like target._gsTransform = {x:0, y:0, z:0, scaleX:1...}
    * @param {boolean=} parse if true, we'll ignore any _gsTransform values that already exist on the element, and force a reparsing of the css (calculated style)
    * @return {object} object containing all of the transform properties/values like {x:0, y:0, z:0, scaleX:1...}
    */
			_getTransform = _internals.getTransform = function (t, cs, rec, parse) {
				if (t._gsTransform && rec && !parse) {
					return t._gsTransform; //if the element already has a _gsTransform, use that. Note: some browsers don't accurately return the calculated style for the transform (particularly for SVG), so it's almost always safest to just use the values we've already applied rather than re-parsing things.
				}
				var tm = rec ? t._gsTransform || new Transform() : new Transform(),
				    invX = tm.scaleX < 0,
				    //in order to interpret things properly, we need to know if the user applied a negative scaleX previously so that we can adjust the rotation and skewX accordingly. Otherwise, if we always interpret a flipped matrix as affecting scaleY and the user only wants to tween the scaleX on multiple sequential tweens, it would keep the negative scaleY without that being the user's intent.
				min = 0.00002,
				    rnd = 100000,
				    zOrigin = _supports3D ? parseFloat(_getStyle(t, _transformOriginProp, cs, false, "0 0 0").split(" ")[2]) || tm.zOrigin || 0 : 0,
				    defaultTransformPerspective = parseFloat(CSSPlugin.defaultTransformPerspective) || 0,
				    m,
				    i,
				    scaleX,
				    scaleY,
				    rotation,
				    skewX;

				tm.svg = !!(t.getBBox && _isSVG(t));
				if (tm.svg) {
					_parseSVGOrigin(t, _getStyle(t, _transformOriginProp, _cs, false, "50% 50%") + "", tm, t.getAttribute("data-svg-origin"));
					_useSVGTransformAttr = CSSPlugin.useSVGTransformAttr || _forceSVGTransformAttr;
				}
				m = _getMatrix(t);
				if (m !== _identity2DMatrix) {

					if (m.length === 16) {
						//we'll only look at these position-related 6 variables first because if x/y/z all match, it's relatively safe to assume we don't need to re-parse everything which risks losing important rotational information (like rotationX:180 plus rotationY:180 would look the same as rotation:180 - there's no way to know for sure which direction was taken based solely on the matrix3d() values)
						var a11 = m[0],
						    a21 = m[1],
						    a31 = m[2],
						    a41 = m[3],
						    a12 = m[4],
						    a22 = m[5],
						    a32 = m[6],
						    a42 = m[7],
						    a13 = m[8],
						    a23 = m[9],
						    a33 = m[10],
						    a14 = m[12],
						    a24 = m[13],
						    a34 = m[14],
						    a43 = m[11],
						    angle = Math.atan2(a32, a33),
						    t1,
						    t2,
						    t3,
						    t4,
						    cos,
						    sin;

						//we manually compensate for non-zero z component of transformOrigin to work around bugs in Safari
						if (tm.zOrigin) {
							a34 = -tm.zOrigin;
							a14 = a13 * a34 - m[12];
							a24 = a23 * a34 - m[13];
							a34 = a33 * a34 + tm.zOrigin - m[14];
						}
						tm.rotationX = angle * _RAD2DEG;
						//rotationX
						if (angle) {
							cos = Math.cos(-angle);
							sin = Math.sin(-angle);
							t1 = a12 * cos + a13 * sin;
							t2 = a22 * cos + a23 * sin;
							t3 = a32 * cos + a33 * sin;
							a13 = a12 * -sin + a13 * cos;
							a23 = a22 * -sin + a23 * cos;
							a33 = a32 * -sin + a33 * cos;
							a43 = a42 * -sin + a43 * cos;
							a12 = t1;
							a22 = t2;
							a32 = t3;
						}
						//rotationY
						angle = Math.atan2(a13, a33);
						tm.rotationY = angle * _RAD2DEG;
						if (angle) {
							cos = Math.cos(-angle);
							sin = Math.sin(-angle);
							t1 = a11 * cos - a13 * sin;
							t2 = a21 * cos - a23 * sin;
							t3 = a31 * cos - a33 * sin;
							a23 = a21 * sin + a23 * cos;
							a33 = a31 * sin + a33 * cos;
							a43 = a41 * sin + a43 * cos;
							a11 = t1;
							a21 = t2;
							a31 = t3;
						}
						//rotationZ
						angle = Math.atan2(a21, a11);
						tm.rotation = angle * _RAD2DEG;
						if (angle) {
							cos = Math.cos(-angle);
							sin = Math.sin(-angle);
							a11 = a11 * cos + a12 * sin;
							t2 = a21 * cos + a22 * sin;
							a22 = a21 * -sin + a22 * cos;
							a32 = a31 * -sin + a32 * cos;
							a21 = t2;
						}

						if (tm.rotationX && Math.abs(tm.rotationX) + Math.abs(tm.rotation) > 359.9) {
							//when rotationY is set, it will often be parsed as 180 degrees different than it should be, and rotationX and rotation both being 180 (it looks the same), so we adjust for that here.
							tm.rotationX = tm.rotation = 0;
							tm.rotationY += 180;
						}

						tm.scaleX = (Math.sqrt(a11 * a11 + a21 * a21) * rnd + 0.5 | 0) / rnd;
						tm.scaleY = (Math.sqrt(a22 * a22 + a23 * a23) * rnd + 0.5 | 0) / rnd;
						tm.scaleZ = (Math.sqrt(a32 * a32 + a33 * a33) * rnd + 0.5 | 0) / rnd;
						tm.skewX = 0;
						tm.perspective = a43 ? 1 / (a43 < 0 ? -a43 : a43) : 0;
						tm.x = a14;
						tm.y = a24;
						tm.z = a34;
						if (tm.svg) {
							tm.x -= tm.xOrigin - (tm.xOrigin * a11 - tm.yOrigin * a12);
							tm.y -= tm.yOrigin - (tm.yOrigin * a21 - tm.xOrigin * a22);
						}
					} else if ((!_supports3D || parse || !m.length || tm.x !== m[4] || tm.y !== m[5] || !tm.rotationX && !tm.rotationY) && !(tm.x !== undefined && _getStyle(t, "display", cs) === "none")) {
						//sometimes a 6-element matrix is returned even when we performed 3D transforms, like if rotationX and rotationY are 180. In cases like this, we still need to honor the 3D transforms. If we just rely on the 2D info, it could affect how the data is interpreted, like scaleY might get set to -1 or rotation could get offset by 180 degrees. For example, do a TweenLite.to(element, 1, {css:{rotationX:180, rotationY:180}}) and then later, TweenLite.to(element, 1, {css:{rotationX:0}}) and without this conditional logic in place, it'd jump to a state of being unrotated when the 2nd tween starts. Then again, we need to honor the fact that the user COULD alter the transforms outside of CSSPlugin, like by manually applying new css, so we try to sense that by looking at x and y because if those changed, we know the changes were made outside CSSPlugin and we force a reinterpretation of the matrix values. Also, in Webkit browsers, if the element's "display" is "none", its calculated style value will always return empty, so if we've already recorded the values in the _gsTransform object, we'll just rely on those.
						var k = m.length >= 6,
						    a = k ? m[0] : 1,
						    b = m[1] || 0,
						    c = m[2] || 0,
						    d = k ? m[3] : 1;
						tm.x = m[4] || 0;
						tm.y = m[5] || 0;
						scaleX = Math.sqrt(a * a + b * b);
						scaleY = Math.sqrt(d * d + c * c);
						rotation = a || b ? Math.atan2(b, a) * _RAD2DEG : tm.rotation || 0; //note: if scaleX is 0, we cannot accurately measure rotation. Same for skewX with a scaleY of 0. Therefore, we default to the previously recorded value (or zero if that doesn't exist).
						skewX = c || d ? Math.atan2(c, d) * _RAD2DEG + rotation : tm.skewX || 0;
						if (Math.abs(skewX) > 90 && Math.abs(skewX) < 270) {
							if (invX) {
								scaleX *= -1;
								skewX += rotation <= 0 ? 180 : -180;
								rotation += rotation <= 0 ? 180 : -180;
							} else {
								scaleY *= -1;
								skewX += skewX <= 0 ? 180 : -180;
							}
						}
						tm.scaleX = scaleX;
						tm.scaleY = scaleY;
						tm.rotation = rotation;
						tm.skewX = skewX;
						if (_supports3D) {
							tm.rotationX = tm.rotationY = tm.z = 0;
							tm.perspective = defaultTransformPerspective;
							tm.scaleZ = 1;
						}
						if (tm.svg) {
							tm.x -= tm.xOrigin - (tm.xOrigin * a + tm.yOrigin * c);
							tm.y -= tm.yOrigin - (tm.xOrigin * b + tm.yOrigin * d);
						}
					}
					tm.zOrigin = zOrigin;
					//some browsers have a hard time with very small values like 2.4492935982947064e-16 (notice the "e-" towards the end) and would render the object slightly off. So we round to 0 in these cases. The conditional logic here is faster than calling Math.abs(). Also, browsers tend to render a SLIGHTLY rotated object in a fuzzy way, so we need to snap to exactly 0 when appropriate.
					for (i in tm) {
						if (tm[i] < min) if (tm[i] > -min) {
							tm[i] = 0;
						}
					}
				}
				//DEBUG: _log("parsed rotation of " + t.getAttribute("id")+": "+(tm.rotationX)+", "+(tm.rotationY)+", "+(tm.rotation)+", scale: "+tm.scaleX+", "+tm.scaleY+", "+tm.scaleZ+", position: "+tm.x+", "+tm.y+", "+tm.z+", perspective: "+tm.perspective+ ", origin: "+ tm.xOrigin+ ","+ tm.yOrigin);
				if (rec) {
					t._gsTransform = tm; //record to the object's _gsTransform which we use so that tweens can control individual properties independently (we need all the properties to accurately recompose the matrix in the setRatio() method)
					if (tm.svg) {
						//if we're supposed to apply transforms to the SVG element's "transform" attribute, make sure there aren't any CSS transforms applied or they'll override the attribute ones. Also clear the transform attribute if we're using CSS, just to be clean.
						if (_useSVGTransformAttr && t.style[_transformProp]) {
							TweenLite.delayedCall(0.001, function () {
								//if we apply this right away (before anything has rendered), we risk there being no transforms for a brief moment and it also interferes with adjusting the transformOrigin in a tween with immediateRender:true (it'd try reading the matrix and it wouldn't have the appropriate data in place because we just removed it).
								_removeProp(t.style, _transformProp);
							});
						} else if (!_useSVGTransformAttr && t.getAttribute("transform")) {
							TweenLite.delayedCall(0.001, function () {
								t.removeAttribute("transform");
							});
						}
					}
				}
				return tm;
			},


			//for setting 2D transforms in IE6, IE7, and IE8 (must use a "filter" to emulate the behavior of modern day browser transforms)
			_setIETransformRatio = function (v) {
				var t = this.data,
				    //refers to the element's _gsTransform object
				ang = -t.rotation * _DEG2RAD,
				    skew = ang + t.skewX * _DEG2RAD,
				    rnd = 100000,
				    a = (Math.cos(ang) * t.scaleX * rnd | 0) / rnd,
				    b = (Math.sin(ang) * t.scaleX * rnd | 0) / rnd,
				    c = (Math.sin(skew) * -t.scaleY * rnd | 0) / rnd,
				    d = (Math.cos(skew) * t.scaleY * rnd | 0) / rnd,
				    style = this.t.style,
				    cs = this.t.currentStyle,
				    filters,
				    val;
				if (!cs) {
					return;
				}
				val = b; //just for swapping the variables an inverting them (reused "val" to avoid creating another variable in memory). IE's filter matrix uses a non-standard matrix configuration (angle goes the opposite way, and b and c are reversed and inverted)
				b = -c;
				c = -val;
				filters = cs.filter;
				style.filter = ""; //remove filters so that we can accurately measure offsetWidth/offsetHeight
				var w = this.t.offsetWidth,
				    h = this.t.offsetHeight,
				    clip = cs.position !== "absolute",
				    m = "progid:DXImageTransform.Microsoft.Matrix(M11=" + a + ", M12=" + b + ", M21=" + c + ", M22=" + d,
				    ox = t.x + w * t.xPercent / 100,
				    oy = t.y + h * t.yPercent / 100,
				    dx,
				    dy;

				//if transformOrigin is being used, adjust the offset x and y
				if (t.ox != null) {
					dx = (t.oxp ? w * t.ox * 0.01 : t.ox) - w / 2;
					dy = (t.oyp ? h * t.oy * 0.01 : t.oy) - h / 2;
					ox += dx - (dx * a + dy * b);
					oy += dy - (dx * c + dy * d);
				}

				if (!clip) {
					m += ", sizingMethod='auto expand')";
				} else {
					dx = w / 2;
					dy = h / 2;
					//translate to ensure that transformations occur around the correct origin (default is center).
					m += ", Dx=" + (dx - (dx * a + dy * b) + ox) + ", Dy=" + (dy - (dx * c + dy * d) + oy) + ")";
				}
				if (filters.indexOf("DXImageTransform.Microsoft.Matrix(") !== -1) {
					style.filter = filters.replace(_ieSetMatrixExp, m);
				} else {
					style.filter = m + " " + filters; //we must always put the transform/matrix FIRST (before alpha(opacity=xx)) to avoid an IE bug that slices part of the object when rotation is applied with alpha.
				}

				//at the end or beginning of the tween, if the matrix is normal (1, 0, 0, 1) and opacity is 100 (or doesn't exist), remove the filter to improve browser performance.
				if (v === 0 || v === 1) if (a === 1) if (b === 0) if (c === 0) if (d === 1) if (!clip || m.indexOf("Dx=0, Dy=0") !== -1) if (!_opacityExp.test(filters) || parseFloat(RegExp.$1) === 100) if (filters.indexOf("gradient(" && filters.indexOf("Alpha")) === -1) {
					style.removeAttribute("filter");
				}

				//we must set the margins AFTER applying the filter in order to avoid some bugs in IE8 that could (in rare scenarios) cause them to be ignored intermittently (vibration).
				if (!clip) {
					var mult = _ieVers < 8 ? 1 : -1,
					    //in Internet Explorer 7 and before, the box model is broken, causing the browser to treat the width/height of the actual rotated filtered image as the width/height of the box itself, but Microsoft corrected that in IE8. We must use a negative offset in IE8 on the right/bottom
					marg,
					    prop,
					    dif;
					dx = t.ieOffsetX || 0;
					dy = t.ieOffsetY || 0;
					t.ieOffsetX = Math.round((w - ((a < 0 ? -a : a) * w + (b < 0 ? -b : b) * h)) / 2 + ox);
					t.ieOffsetY = Math.round((h - ((d < 0 ? -d : d) * h + (c < 0 ? -c : c) * w)) / 2 + oy);
					for (i = 0; i < 4; i++) {
						prop = _margins[i];
						marg = cs[prop];
						//we need to get the current margin in case it is being tweened separately (we want to respect that tween's changes)
						val = marg.indexOf("px") !== -1 ? parseFloat(marg) : _convertToPixels(this.t, prop, parseFloat(marg), marg.replace(_suffixExp, "")) || 0;
						if (val !== t[prop]) {
							dif = i < 2 ? -t.ieOffsetX : -t.ieOffsetY; //if another tween is controlling a margin, we cannot only apply the difference in the ieOffsets, so we essentially zero-out the dx and dy here in that case. We record the margin(s) later so that we can keep comparing them, making this code very flexible.
						} else {
							dif = i < 2 ? dx - t.ieOffsetX : dy - t.ieOffsetY;
						}
						style[prop] = (t[prop] = Math.round(val - dif * (i === 0 || i === 2 ? 1 : mult))) + "px";
					}
				}
			},


			/* translates a super small decimal to a string WITHOUT scientific notation
   _safeDecimal = function(n) {
   	var s = (n < 0 ? -n : n) + "",
   		a = s.split("e-");
   	return (n < 0 ? "-0." : "0.") + new Array(parseInt(a[1], 10) || 0).join("0") + a[0].split(".").join("");
   },
   */

			_setTransformRatio = _internals.set3DTransformRatio = _internals.setTransformRatio = function (v) {
				var t = this.data,
				    //refers to the element's _gsTransform object
				style = this.t.style,
				    angle = t.rotation,
				    rotationX = t.rotationX,
				    rotationY = t.rotationY,
				    sx = t.scaleX,
				    sy = t.scaleY,
				    sz = t.scaleZ,
				    x = t.x,
				    y = t.y,
				    z = t.z,
				    isSVG = t.svg,
				    perspective = t.perspective,
				    force3D = t.force3D,
				    a11,
				    a12,
				    a13,
				    a21,
				    a22,
				    a23,
				    a31,
				    a32,
				    a33,
				    a41,
				    a42,
				    a43,
				    zOrigin,
				    min,
				    cos,
				    sin,
				    t1,
				    t2,
				    transform,
				    comma,
				    zero,
				    skew,
				    rnd;
				//check to see if we should render as 2D (and SVGs must use 2D when _useSVGTransformAttr is true)
				if (((v === 1 || v === 0) && force3D === "auto" && (this.tween._totalTime === this.tween._totalDuration || !this.tween._totalTime) || !force3D) && !z && !perspective && !rotationY && !rotationX || _useSVGTransformAttr && isSVG || !_supports3D) {
					//on the final render (which could be 0 for a from tween), if there are no 3D aspects, render in 2D to free up memory and improve performance especially on mobile devices. Check the tween's totalTime/totalDuration too in order to make sure it doesn't happen between repeats if it's a repeating tween.

					//2D
					if (angle || t.skewX || isSVG) {
						angle *= _DEG2RAD;
						skew = t.skewX * _DEG2RAD;
						rnd = 100000;
						a11 = Math.cos(angle) * sx;
						a21 = Math.sin(angle) * sx;
						a12 = Math.sin(angle - skew) * -sy;
						a22 = Math.cos(angle - skew) * sy;
						if (skew && t.skewType === "simple") {
							//by default, we compensate skewing on the other axis to make it look more natural, but you can set the skewType to "simple" to use the uncompensated skewing that CSS does
							t1 = Math.tan(skew);
							t1 = Math.sqrt(1 + t1 * t1);
							a12 *= t1;
							a22 *= t1;
							if (t.skewY) {
								a11 *= t1;
								a21 *= t1;
							}
						}
						if (isSVG) {
							x += t.xOrigin - (t.xOrigin * a11 + t.yOrigin * a12) + t.xOffset;
							y += t.yOrigin - (t.xOrigin * a21 + t.yOrigin * a22) + t.yOffset;
							if (_useSVGTransformAttr && (t.xPercent || t.yPercent)) {
								//The SVG spec doesn't support percentage-based translation in the "transform" attribute, so we merge it into the matrix to simulate it.
								min = this.t.getBBox();
								x += t.xPercent * 0.01 * min.width;
								y += t.yPercent * 0.01 * min.height;
							}
							min = 0.000001;
							if (x < min) if (x > -min) {
								x = 0;
							}
							if (y < min) if (y > -min) {
								y = 0;
							}
						}
						transform = (a11 * rnd | 0) / rnd + "," + (a21 * rnd | 0) / rnd + "," + (a12 * rnd | 0) / rnd + "," + (a22 * rnd | 0) / rnd + "," + x + "," + y + ")";
						if (isSVG && _useSVGTransformAttr) {
							this.t.setAttribute("transform", "matrix(" + transform);
						} else {
							//some browsers have a hard time with very small values like 2.4492935982947064e-16 (notice the "e-" towards the end) and would render the object slightly off. So we round to 5 decimal places.
							style[_transformProp] = (t.xPercent || t.yPercent ? "translate(" + t.xPercent + "%," + t.yPercent + "%) matrix(" : "matrix(") + transform;
						}
					} else {
						style[_transformProp] = (t.xPercent || t.yPercent ? "translate(" + t.xPercent + "%," + t.yPercent + "%) matrix(" : "matrix(") + sx + ",0,0," + sy + "," + x + "," + y + ")";
					}
					return;
				}
				if (_isFirefox) {
					//Firefox has a bug (at least in v25) that causes it to render the transparent part of 32-bit PNG images as black when displayed inside an iframe and the 3D scale is very small and doesn't change sufficiently enough between renders (like if you use a Power4.easeInOut to scale from 0 to 1 where the beginning values only change a tiny amount to begin the tween before accelerating). In this case, we force the scale to be 0.00002 instead which is visually the same but works around the Firefox issue.
					min = 0.0001;
					if (sx < min && sx > -min) {
						sx = sz = 0.00002;
					}
					if (sy < min && sy > -min) {
						sy = sz = 0.00002;
					}
					if (perspective && !t.z && !t.rotationX && !t.rotationY) {
						//Firefox has a bug that causes elements to have an odd super-thin, broken/dotted black border on elements that have a perspective set but aren't utilizing 3D space (no rotationX, rotationY, or z).
						perspective = 0;
					}
				}
				if (angle || t.skewX) {
					angle *= _DEG2RAD;
					cos = a11 = Math.cos(angle);
					sin = a21 = Math.sin(angle);
					if (t.skewX) {
						angle -= t.skewX * _DEG2RAD;
						cos = Math.cos(angle);
						sin = Math.sin(angle);
						if (t.skewType === "simple") {
							//by default, we compensate skewing on the other axis to make it look more natural, but you can set the skewType to "simple" to use the uncompensated skewing that CSS does
							t1 = Math.tan(t.skewX * _DEG2RAD);
							t1 = Math.sqrt(1 + t1 * t1);
							cos *= t1;
							sin *= t1;
							if (t.skewY) {
								a11 *= t1;
								a21 *= t1;
							}
						}
					}
					a12 = -sin;
					a22 = cos;
				} else if (!rotationY && !rotationX && sz === 1 && !perspective && !isSVG) {
					//if we're only translating and/or 2D scaling, this is faster...
					style[_transformProp] = (t.xPercent || t.yPercent ? "translate(" + t.xPercent + "%," + t.yPercent + "%) translate3d(" : "translate3d(") + x + "px," + y + "px," + z + "px)" + (sx !== 1 || sy !== 1 ? " scale(" + sx + "," + sy + ")" : "");
					return;
				} else {
					a11 = a22 = 1;
					a12 = a21 = 0;
				}
				// KEY  INDEX   AFFECTS
				// a11  0       rotation, rotationY, scaleX
				// a21  1       rotation, rotationY, scaleX
				// a31  2       rotationY, scaleX
				// a41  3       rotationY, scaleX
				// a12  4       rotation, skewX, rotationX, scaleY
				// a22  5       rotation, skewX, rotationX, scaleY
				// a32  6       rotationX, scaleY
				// a42  7       rotationX, scaleY
				// a13  8       rotationY, rotationX, scaleZ
				// a23  9       rotationY, rotationX, scaleZ
				// a33  10      rotationY, rotationX, scaleZ
				// a43  11      rotationY, rotationX, perspective, scaleZ
				// a14  12      x, zOrigin, svgOrigin
				// a24  13      y, zOrigin, svgOrigin
				// a34  14      z, zOrigin
				// a44  15
				// rotation: Math.atan2(a21, a11)
				// rotationY: Math.atan2(a13, a33) (or Math.atan2(a13, a11))
				// rotationX: Math.atan2(a32, a33)
				a33 = 1;
				a13 = a23 = a31 = a32 = a41 = a42 = 0;
				a43 = perspective ? -1 / perspective : 0;
				zOrigin = t.zOrigin;
				min = 0.000001; //threshold below which browsers use scientific notation which won't work.
				comma = ",";
				zero = "0";
				angle = rotationY * _DEG2RAD;
				if (angle) {
					cos = Math.cos(angle);
					sin = Math.sin(angle);
					a31 = -sin;
					a41 = a43 * -sin;
					a13 = a11 * sin;
					a23 = a21 * sin;
					a33 = cos;
					a43 *= cos;
					a11 *= cos;
					a21 *= cos;
				}
				angle = rotationX * _DEG2RAD;
				if (angle) {
					cos = Math.cos(angle);
					sin = Math.sin(angle);
					t1 = a12 * cos + a13 * sin;
					t2 = a22 * cos + a23 * sin;
					a32 = a33 * sin;
					a42 = a43 * sin;
					a13 = a12 * -sin + a13 * cos;
					a23 = a22 * -sin + a23 * cos;
					a33 = a33 * cos;
					a43 = a43 * cos;
					a12 = t1;
					a22 = t2;
				}
				if (sz !== 1) {
					a13 *= sz;
					a23 *= sz;
					a33 *= sz;
					a43 *= sz;
				}
				if (sy !== 1) {
					a12 *= sy;
					a22 *= sy;
					a32 *= sy;
					a42 *= sy;
				}
				if (sx !== 1) {
					a11 *= sx;
					a21 *= sx;
					a31 *= sx;
					a41 *= sx;
				}

				if (zOrigin || isSVG) {
					if (zOrigin) {
						x += a13 * -zOrigin;
						y += a23 * -zOrigin;
						z += a33 * -zOrigin + zOrigin;
					}
					if (isSVG) {
						//due to bugs in some browsers, we need to manage the transform-origin of SVG manually
						x += t.xOrigin - (t.xOrigin * a11 + t.yOrigin * a12) + t.xOffset;
						y += t.yOrigin - (t.xOrigin * a21 + t.yOrigin * a22) + t.yOffset;
					}
					if (x < min && x > -min) {
						x = zero;
					}
					if (y < min && y > -min) {
						y = zero;
					}
					if (z < min && z > -min) {
						z = 0; //don't use string because we calculate perspective later and need the number.
					}
				}

				//optimized way of concatenating all the values into a string. If we do it all in one shot, it's slower because of the way browsers have to create temp strings and the way it affects memory. If we do it piece-by-piece with +=, it's a bit slower too. We found that doing it in these sized chunks works best overall:
				transform = t.xPercent || t.yPercent ? "translate(" + t.xPercent + "%," + t.yPercent + "%) matrix3d(" : "matrix3d(";
				transform += (a11 < min && a11 > -min ? zero : a11) + comma + (a21 < min && a21 > -min ? zero : a21) + comma + (a31 < min && a31 > -min ? zero : a31);
				transform += comma + (a41 < min && a41 > -min ? zero : a41) + comma + (a12 < min && a12 > -min ? zero : a12) + comma + (a22 < min && a22 > -min ? zero : a22);
				if (rotationX || rotationY) {
					//performance optimization (often there's no rotationX or rotationY, so we can skip these calculations)
					transform += comma + (a32 < min && a32 > -min ? zero : a32) + comma + (a42 < min && a42 > -min ? zero : a42) + comma + (a13 < min && a13 > -min ? zero : a13);
					transform += comma + (a23 < min && a23 > -min ? zero : a23) + comma + (a33 < min && a33 > -min ? zero : a33) + comma + (a43 < min && a43 > -min ? zero : a43) + comma;
				} else {
					transform += ",0,0,0,0,1,0,";
				}
				transform += x + comma + y + comma + z + comma + (perspective ? 1 + -z / perspective : 1) + ")";

				style[_transformProp] = transform;
			};

			p = Transform.prototype;
			p.x = p.y = p.z = p.skewX = p.skewY = p.rotation = p.rotationX = p.rotationY = p.zOrigin = p.xPercent = p.yPercent = p.xOffset = p.yOffset = 0;
			p.scaleX = p.scaleY = p.scaleZ = 1;

			_registerComplexSpecialProp("transform,scale,scaleX,scaleY,scaleZ,x,y,z,rotation,rotationX,rotationY,rotationZ,skewX,skewY,shortRotation,shortRotationX,shortRotationY,shortRotationZ,transformOrigin,svgOrigin,transformPerspective,directionalRotation,parseTransform,force3D,skewType,xPercent,yPercent,smoothOrigin", { parser: function (t, e, p, cssp, pt, plugin, vars) {
					if (cssp._lastParsedTransform === vars) {
						return pt;
					} //only need to parse the transform once, and only if the browser supports it.
					cssp._lastParsedTransform = vars;
					var originalGSTransform = t._gsTransform,
					    style = t.style,
					    min = 0.000001,
					    i = _transformProps.length,
					    v = vars,
					    endRotations = {},
					    transformOriginString = "transformOrigin",
					    m1,
					    m2,
					    skewY,
					    copy,
					    orig,
					    has3D,
					    hasChange,
					    dr,
					    x,
					    y;
					if (vars.display) {
						//if the user is setting display during this tween, it may not be instantiated yet but we must force it here in order to get accurate readings. If display is "none", some browsers refuse to report the transform properties correctly.
						copy = _getStyle(t, "display");
						style.display = "block";
						m1 = _getTransform(t, _cs, true, vars.parseTransform);
						style.display = copy;
					} else {
						m1 = _getTransform(t, _cs, true, vars.parseTransform);
					}
					cssp._transform = m1;
					if (typeof v.transform === "string" && _transformProp) {
						//for values like transform:"rotate(60deg) scale(0.5, 0.8)"
						copy = _tempDiv.style; //don't use the original target because it might be SVG in which case some browsers don't report computed style correctly.
						copy[_transformProp] = v.transform;
						copy.display = "block"; //if display is "none", the browser often refuses to report the transform properties correctly.
						copy.position = "absolute";
						_doc.body.appendChild(_tempDiv);
						m2 = _getTransform(_tempDiv, null, false);
						_doc.body.removeChild(_tempDiv);
						if (!m2.perspective) {
							m2.perspective = m1.perspective; //tweening to no perspective gives very unintuitive results - just keep the same perspective in that case.
						}
						if (v.xPercent != null) {
							m2.xPercent = _parseVal(v.xPercent, m1.xPercent);
						}
						if (v.yPercent != null) {
							m2.yPercent = _parseVal(v.yPercent, m1.yPercent);
						}
					} else if (typeof v === "object") {
						//for values like scaleX, scaleY, rotation, x, y, skewX, and skewY or transform:{...} (object)
						m2 = { scaleX: _parseVal(v.scaleX != null ? v.scaleX : v.scale, m1.scaleX),
							scaleY: _parseVal(v.scaleY != null ? v.scaleY : v.scale, m1.scaleY),
							scaleZ: _parseVal(v.scaleZ, m1.scaleZ),
							x: _parseVal(v.x, m1.x),
							y: _parseVal(v.y, m1.y),
							z: _parseVal(v.z, m1.z),
							xPercent: _parseVal(v.xPercent, m1.xPercent),
							yPercent: _parseVal(v.yPercent, m1.yPercent),
							perspective: _parseVal(v.transformPerspective, m1.perspective) };
						dr = v.directionalRotation;
						if (dr != null) {
							if (typeof dr === "object") {
								for (copy in dr) {
									v[copy] = dr[copy];
								}
							} else {
								v.rotation = dr;
							}
						}
						if (typeof v.x === "string" && v.x.indexOf("%") !== -1) {
							m2.x = 0;
							m2.xPercent = _parseVal(v.x, m1.xPercent);
						}
						if (typeof v.y === "string" && v.y.indexOf("%") !== -1) {
							m2.y = 0;
							m2.yPercent = _parseVal(v.y, m1.yPercent);
						}

						m2.rotation = _parseAngle("rotation" in v ? v.rotation : "shortRotation" in v ? v.shortRotation + "_short" : "rotationZ" in v ? v.rotationZ : m1.rotation, m1.rotation, "rotation", endRotations);
						if (_supports3D) {
							m2.rotationX = _parseAngle("rotationX" in v ? v.rotationX : "shortRotationX" in v ? v.shortRotationX + "_short" : m1.rotationX || 0, m1.rotationX, "rotationX", endRotations);
							m2.rotationY = _parseAngle("rotationY" in v ? v.rotationY : "shortRotationY" in v ? v.shortRotationY + "_short" : m1.rotationY || 0, m1.rotationY, "rotationY", endRotations);
						}
						m2.skewX = v.skewX == null ? m1.skewX : _parseAngle(v.skewX, m1.skewX);

						//note: for performance reasons, we combine all skewing into the skewX and rotation values, ignoring skewY but we must still record it so that we can discern how much of the overall skew is attributed to skewX vs. skewY. Otherwise, if the skewY would always act relative (tween skewY to 10deg, for example, multiple times and if we always combine things into skewX, we can't remember that skewY was 10 from last time). Remember, a skewY of 10 degrees looks the same as a rotation of 10 degrees plus a skewX of -10 degrees.
						m2.skewY = v.skewY == null ? m1.skewY : _parseAngle(v.skewY, m1.skewY);
						if (skewY = m2.skewY - m1.skewY) {
							m2.skewX += skewY;
							m2.rotation += skewY;
						}
					}
					if (_supports3D && v.force3D != null) {
						m1.force3D = v.force3D;
						hasChange = true;
					}

					m1.skewType = v.skewType || m1.skewType || CSSPlugin.defaultSkewType;

					has3D = m1.force3D || m1.z || m1.rotationX || m1.rotationY || m2.z || m2.rotationX || m2.rotationY || m2.perspective;
					if (!has3D && v.scale != null) {
						m2.scaleZ = 1; //no need to tween scaleZ.
					}

					while (--i > -1) {
						p = _transformProps[i];
						orig = m2[p] - m1[p];
						if (orig > min || orig < -min || v[p] != null || _forcePT[p] != null) {
							hasChange = true;
							pt = new CSSPropTween(m1, p, m1[p], orig, pt);
							if (p in endRotations) {
								pt.e = endRotations[p]; //directional rotations typically have compensated values during the tween, but we need to make sure they end at exactly what the user requested
							}
							pt.xs0 = 0; //ensures the value stays numeric in setRatio()
							pt.plugin = plugin;
							cssp._overwriteProps.push(pt.n);
						}
					}

					orig = v.transformOrigin;
					if (m1.svg && (orig || v.svgOrigin)) {
						x = m1.xOffset; //when we change the origin, in order to prevent things from jumping we adjust the x/y so we must record those here so that we can create PropTweens for them and flip them at the same time as the origin
						y = m1.yOffset;
						_parseSVGOrigin(t, _parsePosition(orig), m2, v.svgOrigin, v.smoothOrigin);
						pt = _addNonTweeningNumericPT(m1, "xOrigin", (originalGSTransform ? m1 : m2).xOrigin, m2.xOrigin, pt, transformOriginString); //note: if there wasn't a transformOrigin defined yet, just start with the destination one; it's wasteful otherwise, and it causes problems with fromTo() tweens. For example, TweenLite.to("#wheel", 3, {rotation:180, transformOrigin:"50% 50%", delay:1}); TweenLite.fromTo("#wheel", 3, {scale:0.5, transformOrigin:"50% 50%"}, {scale:1, delay:2}); would cause a jump when the from values revert at the beginning of the 2nd tween.
						pt = _addNonTweeningNumericPT(m1, "yOrigin", (originalGSTransform ? m1 : m2).yOrigin, m2.yOrigin, pt, transformOriginString);
						if (x !== m1.xOffset || y !== m1.yOffset) {
							pt = _addNonTweeningNumericPT(m1, "xOffset", originalGSTransform ? x : m1.xOffset, m1.xOffset, pt, transformOriginString);
							pt = _addNonTweeningNumericPT(m1, "yOffset", originalGSTransform ? y : m1.yOffset, m1.yOffset, pt, transformOriginString);
						}
						orig = _useSVGTransformAttr ? null : "0px 0px"; //certain browsers (like firefox) completely botch transform-origin, so we must remove it to prevent it from contaminating transforms. We manage it ourselves with xOrigin and yOrigin
					}
					if (orig || _supports3D && has3D && m1.zOrigin) {
						//if anything 3D is happening and there's a transformOrigin with a z component that's non-zero, we must ensure that the transformOrigin's z-component is set to 0 so that we can manually do those calculations to get around Safari bugs. Even if the user didn't specifically define a "transformOrigin" in this particular tween (maybe they did it via css directly).
						if (_transformProp) {
							hasChange = true;
							p = _transformOriginProp;
							orig = (orig || _getStyle(t, p, _cs, false, "50% 50%")) + ""; //cast as string to avoid errors
							pt = new CSSPropTween(style, p, 0, 0, pt, -1, transformOriginString);
							pt.b = style[p];
							pt.plugin = plugin;
							if (_supports3D) {
								copy = m1.zOrigin;
								orig = orig.split(" ");
								m1.zOrigin = (orig.length > 2 && !(copy !== 0 && orig[2] === "0px") ? parseFloat(orig[2]) : copy) || 0; //Safari doesn't handle the z part of transformOrigin correctly, so we'll manually handle it in the _set3DTransformRatio() method.
								pt.xs0 = pt.e = orig[0] + " " + (orig[1] || "50%") + " 0px"; //we must define a z value of 0px specifically otherwise iOS 5 Safari will stick with the old one (if one was defined)!
								pt = new CSSPropTween(m1, "zOrigin", 0, 0, pt, -1, pt.n); //we must create a CSSPropTween for the _gsTransform.zOrigin so that it gets reset properly at the beginning if the tween runs backward (as opposed to just setting m1.zOrigin here)
								pt.b = copy;
								pt.xs0 = pt.e = m1.zOrigin;
							} else {
								pt.xs0 = pt.e = orig;
							}

							//for older versions of IE (6-8), we need to manually calculate things inside the setRatio() function. We record origin x and y (ox and oy) and whether or not the values are percentages (oxp and oyp).
						} else {
							_parsePosition(orig + "", m1);
						}
					}
					if (hasChange) {
						cssp._transformType = !(m1.svg && _useSVGTransformAttr) && (has3D || this._transformType === 3) ? 3 : 2; //quicker than calling cssp._enableTransforms();
					}
					return pt;
				}, prefix: true });

			_registerComplexSpecialProp("boxShadow", { defaultValue: "0px 0px 0px 0px #999", prefix: true, color: true, multi: true, keyword: "inset" });

			_registerComplexSpecialProp("borderRadius", { defaultValue: "0px", parser: function (t, e, p, cssp, pt, plugin) {
					e = this.format(e);
					var props = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"],
					    style = t.style,
					    ea1,
					    i,
					    es2,
					    bs2,
					    bs,
					    es,
					    bn,
					    en,
					    w,
					    h,
					    esfx,
					    bsfx,
					    rel,
					    hn,
					    vn,
					    em;
					w = parseFloat(t.offsetWidth);
					h = parseFloat(t.offsetHeight);
					ea1 = e.split(" ");
					for (i = 0; i < props.length; i++) {
						//if we're dealing with percentages, we must convert things separately for the horizontal and vertical axis!
						if (this.p.indexOf("border")) {
							//older browsers used a prefix
							props[i] = _checkPropPrefix(props[i]);
						}
						bs = bs2 = _getStyle(t, props[i], _cs, false, "0px");
						if (bs.indexOf(" ") !== -1) {
							bs2 = bs.split(" ");
							bs = bs2[0];
							bs2 = bs2[1];
						}
						es = es2 = ea1[i];
						bn = parseFloat(bs);
						bsfx = bs.substr((bn + "").length);
						rel = es.charAt(1) === "=";
						if (rel) {
							en = parseInt(es.charAt(0) + "1", 10);
							es = es.substr(2);
							en *= parseFloat(es);
							esfx = es.substr((en + "").length - (en < 0 ? 1 : 0)) || "";
						} else {
							en = parseFloat(es);
							esfx = es.substr((en + "").length);
						}
						if (esfx === "") {
							esfx = _suffixMap[p] || bsfx;
						}
						if (esfx !== bsfx) {
							hn = _convertToPixels(t, "borderLeft", bn, bsfx); //horizontal number (we use a bogus "borderLeft" property just because the _convertToPixels() method searches for the keywords "Left", "Right", "Top", and "Bottom" to determine of it's a horizontal or vertical property, and we need "border" in the name so that it knows it should measure relative to the element itself, not its parent.
							vn = _convertToPixels(t, "borderTop", bn, bsfx); //vertical number
							if (esfx === "%") {
								bs = hn / w * 100 + "%";
								bs2 = vn / h * 100 + "%";
							} else if (esfx === "em") {
								em = _convertToPixels(t, "borderLeft", 1, "em");
								bs = hn / em + "em";
								bs2 = vn / em + "em";
							} else {
								bs = hn + "px";
								bs2 = vn + "px";
							}
							if (rel) {
								es = parseFloat(bs) + en + esfx;
								es2 = parseFloat(bs2) + en + esfx;
							}
						}
						pt = _parseComplex(style, props[i], bs + " " + bs2, es + " " + es2, false, "0px", pt);
					}
					return pt;
				}, prefix: true, formatter: _getFormatter("0px 0px 0px 0px", false, true) });
			_registerComplexSpecialProp("backgroundPosition", { defaultValue: "0 0", parser: function (t, e, p, cssp, pt, plugin) {
					var bp = "background-position",
					    cs = _cs || _getComputedStyle(t, null),
					    bs = this.format((cs ? _ieVers ? cs.getPropertyValue(bp + "-x") + " " + cs.getPropertyValue(bp + "-y") : cs.getPropertyValue(bp) : t.currentStyle.backgroundPositionX + " " + t.currentStyle.backgroundPositionY) || "0 0"),
					    //Internet Explorer doesn't report background-position correctly - we must query background-position-x and background-position-y and combine them (even in IE10). Before IE9, we must do the same with the currentStyle object and use camelCase
					es = this.format(e),
					    ba,
					    ea,
					    i,
					    pct,
					    overlap,
					    src;
					if (bs.indexOf("%") !== -1 !== (es.indexOf("%") !== -1)) {
						src = _getStyle(t, "backgroundImage").replace(_urlExp, "");
						if (src && src !== "none") {
							ba = bs.split(" ");
							ea = es.split(" ");
							_tempImg.setAttribute("src", src); //set the temp IMG's src to the background-image so that we can measure its width/height
							i = 2;
							while (--i > -1) {
								bs = ba[i];
								pct = bs.indexOf("%") !== -1;
								if (pct !== (ea[i].indexOf("%") !== -1)) {
									overlap = i === 0 ? t.offsetWidth - _tempImg.width : t.offsetHeight - _tempImg.height;
									ba[i] = pct ? parseFloat(bs) / 100 * overlap + "px" : parseFloat(bs) / overlap * 100 + "%";
								}
							}
							bs = ba.join(" ");
						}
					}
					return this.parseComplex(t.style, bs, es, pt, plugin);
				}, formatter: _parsePosition });
			_registerComplexSpecialProp("backgroundSize", { defaultValue: "0 0", formatter: _parsePosition });
			_registerComplexSpecialProp("perspective", { defaultValue: "0px", prefix: true });
			_registerComplexSpecialProp("perspectiveOrigin", { defaultValue: "50% 50%", prefix: true });
			_registerComplexSpecialProp("transformStyle", { prefix: true });
			_registerComplexSpecialProp("backfaceVisibility", { prefix: true });
			_registerComplexSpecialProp("userSelect", { prefix: true });
			_registerComplexSpecialProp("margin", { parser: _getEdgeParser("marginTop,marginRight,marginBottom,marginLeft") });
			_registerComplexSpecialProp("padding", { parser: _getEdgeParser("paddingTop,paddingRight,paddingBottom,paddingLeft") });
			_registerComplexSpecialProp("clip", { defaultValue: "rect(0px,0px,0px,0px)", parser: function (t, e, p, cssp, pt, plugin) {
					var b, cs, delim;
					if (_ieVers < 9) {
						//IE8 and earlier don't report a "clip" value in the currentStyle - instead, the values are split apart into clipTop, clipRight, clipBottom, and clipLeft. Also, in IE7 and earlier, the values inside rect() are space-delimited, not comma-delimited.
						cs = t.currentStyle;
						delim = _ieVers < 8 ? " " : ",";
						b = "rect(" + cs.clipTop + delim + cs.clipRight + delim + cs.clipBottom + delim + cs.clipLeft + ")";
						e = this.format(e).split(",").join(delim);
					} else {
						b = this.format(_getStyle(t, this.p, _cs, false, this.dflt));
						e = this.format(e);
					}
					return this.parseComplex(t.style, b, e, pt, plugin);
				} });
			_registerComplexSpecialProp("textShadow", { defaultValue: "0px 0px 0px #999", color: true, multi: true });
			_registerComplexSpecialProp("autoRound,strictUnits", { parser: function (t, e, p, cssp, pt) {
					return pt;
				} }); //just so that we can ignore these properties (not tween them)
			_registerComplexSpecialProp("border", { defaultValue: "0px solid #000", parser: function (t, e, p, cssp, pt, plugin) {
					return this.parseComplex(t.style, this.format(_getStyle(t, "borderTopWidth", _cs, false, "0px") + " " + _getStyle(t, "borderTopStyle", _cs, false, "solid") + " " + _getStyle(t, "borderTopColor", _cs, false, "#000")), this.format(e), pt, plugin);
				}, color: true, formatter: function (v) {
					var a = v.split(" ");
					return a[0] + " " + (a[1] || "solid") + " " + (v.match(_colorExp) || ["#000"])[0];
				} });
			_registerComplexSpecialProp("borderWidth", { parser: _getEdgeParser("borderTopWidth,borderRightWidth,borderBottomWidth,borderLeftWidth") }); //Firefox doesn't pick up on borderWidth set in style sheets (only inline).
			_registerComplexSpecialProp("float,cssFloat,styleFloat", { parser: function (t, e, p, cssp, pt, plugin) {
					var s = t.style,
					    prop = "cssFloat" in s ? "cssFloat" : "styleFloat";
					return new CSSPropTween(s, prop, 0, 0, pt, -1, p, false, 0, s[prop], e);
				} });

			//opacity-related
			var _setIEOpacityRatio = function (v) {
				var t = this.t,
				    //refers to the element's style property
				filters = t.filter || _getStyle(this.data, "filter") || "",
				    val = this.s + this.c * v | 0,
				    skip;
				if (val === 100) {
					//for older versions of IE that need to use a filter to apply opacity, we should remove the filter if opacity hits 1 in order to improve performance, but make sure there isn't a transform (matrix) or gradient in the filters.
					if (filters.indexOf("atrix(") === -1 && filters.indexOf("radient(") === -1 && filters.indexOf("oader(") === -1) {
						t.removeAttribute("filter");
						skip = !_getStyle(this.data, "filter"); //if a class is applied that has an alpha filter, it will take effect (we don't want that), so re-apply our alpha filter in that case. We must first remove it and then check.
					} else {
						t.filter = filters.replace(_alphaFilterExp, "");
						skip = true;
					}
				}
				if (!skip) {
					if (this.xn1) {
						t.filter = filters = filters || "alpha(opacity=" + val + ")"; //works around bug in IE7/8 that prevents changes to "visibility" from being applied properly if the filter is changed to a different alpha on the same frame.
					}
					if (filters.indexOf("pacity") === -1) {
						//only used if browser doesn't support the standard opacity style property (IE 7 and 8). We omit the "O" to avoid case-sensitivity issues
						if (val !== 0 || !this.xn1) {
							//bugs in IE7/8 won't render the filter properly if opacity is ADDED on the same frame/render as "visibility" changes (this.xn1 is 1 if this tween is an "autoAlpha" tween)
							t.filter = filters + " alpha(opacity=" + val + ")"; //we round the value because otherwise, bugs in IE7/8 can prevent "visibility" changes from being applied properly.
						}
					} else {
						t.filter = filters.replace(_opacityExp, "opacity=" + val);
					}
				}
			};
			_registerComplexSpecialProp("opacity,alpha,autoAlpha", { defaultValue: "1", parser: function (t, e, p, cssp, pt, plugin) {
					var b = parseFloat(_getStyle(t, "opacity", _cs, false, "1")),
					    style = t.style,
					    isAutoAlpha = p === "autoAlpha";
					if (typeof e === "string" && e.charAt(1) === "=") {
						e = (e.charAt(0) === "-" ? -1 : 1) * parseFloat(e.substr(2)) + b;
					}
					if (isAutoAlpha && b === 1 && _getStyle(t, "visibility", _cs) === "hidden" && e !== 0) {
						//if visibility is initially set to "hidden", we should interpret that as intent to make opacity 0 (a convenience)
						b = 0;
					}
					if (_supportsOpacity) {
						pt = new CSSPropTween(style, "opacity", b, e - b, pt);
					} else {
						pt = new CSSPropTween(style, "opacity", b * 100, (e - b) * 100, pt);
						pt.xn1 = isAutoAlpha ? 1 : 0; //we need to record whether or not this is an autoAlpha so that in the setRatio(), we know to duplicate the setting of the alpha in order to work around a bug in IE7 and IE8 that prevents changes to "visibility" from taking effect if the filter is changed to a different alpha(opacity) at the same time. Setting it to the SAME value first, then the new value works around the IE7/8 bug.
						style.zoom = 1; //helps correct an IE issue.
						pt.type = 2;
						pt.b = "alpha(opacity=" + pt.s + ")";
						pt.e = "alpha(opacity=" + (pt.s + pt.c) + ")";
						pt.data = t;
						pt.plugin = plugin;
						pt.setRatio = _setIEOpacityRatio;
					}
					if (isAutoAlpha) {
						//we have to create the "visibility" PropTween after the opacity one in the linked list so that they run in the order that works properly in IE8 and earlier
						pt = new CSSPropTween(style, "visibility", 0, 0, pt, -1, null, false, 0, b !== 0 ? "inherit" : "hidden", e === 0 ? "hidden" : "inherit");
						pt.xs0 = "inherit";
						cssp._overwriteProps.push(pt.n);
						cssp._overwriteProps.push(p);
					}
					return pt;
				} });

			var _removeProp = function (s, p) {
				if (p) {
					if (s.removeProperty) {
						if (p.substr(0, 2) === "ms" || p.substr(0, 6) === "webkit") {
							//Microsoft and some Webkit browsers don't conform to the standard of capitalizing the first prefix character, so we adjust so that when we prefix the caps with a dash, it's correct (otherwise it'd be "ms-transform" instead of "-ms-transform" for IE9, for example)
							p = "-" + p;
						}
						s.removeProperty(p.replace(_capsExp, "-$1").toLowerCase());
					} else {
						//note: old versions of IE use "removeAttribute()" instead of "removeProperty()"
						s.removeAttribute(p);
					}
				}
			},
			    _setClassNameRatio = function (v) {
				this.t._gsClassPT = this;
				if (v === 1 || v === 0) {
					this.t.setAttribute("class", v === 0 ? this.b : this.e);
					var mpt = this.data,
					    //first MiniPropTween
					s = this.t.style;
					while (mpt) {
						if (!mpt.v) {
							_removeProp(s, mpt.p);
						} else {
							s[mpt.p] = mpt.v;
						}
						mpt = mpt._next;
					}
					if (v === 1 && this.t._gsClassPT === this) {
						this.t._gsClassPT = null;
					}
				} else if (this.t.getAttribute("class") !== this.e) {
					this.t.setAttribute("class", this.e);
				}
			};
			_registerComplexSpecialProp("className", { parser: function (t, e, p, cssp, pt, plugin, vars) {
					var b = t.getAttribute("class") || "",
					    //don't use t.className because it doesn't work consistently on SVG elements; getAttribute("class") and setAttribute("class", value") is more reliable.
					cssText = t.style.cssText,
					    difData,
					    bs,
					    cnpt,
					    cnptLookup,
					    mpt;
					pt = cssp._classNamePT = new CSSPropTween(t, p, 0, 0, pt, 2);
					pt.setRatio = _setClassNameRatio;
					pt.pr = -11;
					_hasPriority = true;
					pt.b = b;
					bs = _getAllStyles(t, _cs);
					//if there's a className tween already operating on the target, force it to its end so that the necessary inline styles are removed and the class name is applied before we determine the end state (we don't want inline styles interfering that were there just for class-specific values)
					cnpt = t._gsClassPT;
					if (cnpt) {
						cnptLookup = {};
						mpt = cnpt.data; //first MiniPropTween which stores the inline styles - we need to force these so that the inline styles don't contaminate things. Otherwise, there's a small chance that a tween could start and the inline values match the destination values and they never get cleaned.
						while (mpt) {
							cnptLookup[mpt.p] = 1;
							mpt = mpt._next;
						}
						cnpt.setRatio(1);
					}
					t._gsClassPT = pt;
					pt.e = e.charAt(1) !== "=" ? e : b.replace(new RegExp("\\s*\\b" + e.substr(2) + "\\b"), "") + (e.charAt(0) === "+" ? " " + e.substr(2) : "");
					t.setAttribute("class", pt.e);
					difData = _cssDif(t, bs, _getAllStyles(t), vars, cnptLookup);
					t.setAttribute("class", b);
					pt.data = difData.firstMPT;
					t.style.cssText = cssText; //we recorded cssText before we swapped classes and ran _getAllStyles() because in cases when a className tween is overwritten, we remove all the related tweening properties from that class change (otherwise class-specific stuff can't override properties we've directly set on the target's style object due to specificity).
					pt = pt.xfirst = cssp.parse(t, difData.difs, pt, plugin); //we record the CSSPropTween as the xfirst so that we can handle overwriting propertly (if "className" gets overwritten, we must kill all the properties associated with the className part of the tween, so we can loop through from xfirst to the pt itself)
					return pt;
				} });

			var _setClearPropsRatio = function (v) {
				if (v === 1 || v === 0) if (this.data._totalTime === this.data._totalDuration && this.data.data !== "isFromStart") {
					//this.data refers to the tween. Only clear at the END of the tween (remember, from() tweens make the ratio go from 1 to 0, so we can't just check that and if the tween is the zero-duration one that's created internally to render the starting values in a from() tween, ignore that because otherwise, for example, from(...{height:100, clearProps:"height", delay:1}) would wipe the height at the beginning of the tween and after 1 second, it'd kick back in).
					var s = this.t.style,
					    transformParse = _specialProps.transform.parse,
					    a,
					    p,
					    i,
					    clearTransform,
					    transform;
					if (this.e === "all") {
						s.cssText = "";
						clearTransform = true;
					} else {
						a = this.e.split(" ").join("").split(",");
						i = a.length;
						while (--i > -1) {
							p = a[i];
							if (_specialProps[p]) {
								if (_specialProps[p].parse === transformParse) {
									clearTransform = true;
								} else {
									p = p === "transformOrigin" ? _transformOriginProp : _specialProps[p].p; //ensures that special properties use the proper browser-specific property name, like "scaleX" might be "-webkit-transform" or "boxShadow" might be "-moz-box-shadow"
								}
							}
							_removeProp(s, p);
						}
					}
					if (clearTransform) {
						_removeProp(s, _transformProp);
						transform = this.t._gsTransform;
						if (transform) {
							if (transform.svg) {
								this.t.removeAttribute("data-svg-origin");
							}
							delete this.t._gsTransform;
						}
					}
				}
			};
			_registerComplexSpecialProp("clearProps", { parser: function (t, e, p, cssp, pt) {
					pt = new CSSPropTween(t, p, 0, 0, pt, 2);
					pt.setRatio = _setClearPropsRatio;
					pt.e = e;
					pt.pr = -10;
					pt.data = cssp._tween;
					_hasPriority = true;
					return pt;
				} });

			p = "bezier,throwProps,physicsProps,physics2D".split(",");
			i = p.length;
			while (i--) {
				_registerPluginProp(p[i]);
			}

			p = CSSPlugin.prototype;
			p._firstPT = p._lastParsedTransform = p._transform = null;

			//gets called when the tween renders for the first time. This kicks everything off, recording start/end values, etc.
			p._onInitTween = function (target, vars, tween) {
				if (!target.nodeType) {
					//css is only for dom elements
					return false;
				}
				this._target = target;
				this._tween = tween;
				this._vars = vars;
				_autoRound = vars.autoRound;
				_hasPriority = false;
				_suffixMap = vars.suffixMap || CSSPlugin.suffixMap;
				_cs = _getComputedStyle(target, "");
				_overwriteProps = this._overwriteProps;
				var style = target.style,
				    v,
				    pt,
				    pt2,
				    first,
				    last,
				    next,
				    zIndex,
				    tpt,
				    threeD;
				if (_reqSafariFix) if (style.zIndex === "") {
					v = _getStyle(target, "zIndex", _cs);
					if (v === "auto" || v === "") {
						//corrects a bug in [non-Android] Safari that prevents it from repainting elements in their new positions if they don't have a zIndex set. We also can't just apply this inside _parseTransform() because anything that's moved in any way (like using "left" or "top" instead of transforms like "x" and "y") can be affected, so it is best to ensure that anything that's tweening has a z-index. Setting "WebkitPerspective" to a non-zero value worked too except that on iOS Safari things would flicker randomly. Plus zIndex is less memory-intensive.
						this._addLazySet(style, "zIndex", 0);
					}
				}

				if (typeof vars === "string") {
					first = style.cssText;
					v = _getAllStyles(target, _cs);
					style.cssText = first + ";" + vars;
					v = _cssDif(target, v, _getAllStyles(target)).difs;
					if (!_supportsOpacity && _opacityValExp.test(vars)) {
						v.opacity = parseFloat(RegExp.$1);
					}
					vars = v;
					style.cssText = first;
				}

				if (vars.className) {
					//className tweens will combine any differences they find in the css with the vars that are passed in, so {className:"myClass", scale:0.5, left:20} would work.
					this._firstPT = pt = _specialProps.className.parse(target, vars.className, "className", this, null, null, vars);
				} else {
					this._firstPT = pt = this.parse(target, vars, null);
				}

				if (this._transformType) {
					threeD = this._transformType === 3;
					if (!_transformProp) {
						style.zoom = 1; //helps correct an IE issue.
					} else if (_isSafari) {
						_reqSafariFix = true;
						//if zIndex isn't set, iOS Safari doesn't repaint things correctly sometimes (seemingly at random).
						if (style.zIndex === "") {
							zIndex = _getStyle(target, "zIndex", _cs);
							if (zIndex === "auto" || zIndex === "") {
								this._addLazySet(style, "zIndex", 0);
							}
						}
						//Setting WebkitBackfaceVisibility corrects 3 bugs:
						// 1) [non-Android] Safari skips rendering changes to "top" and "left" that are made on the same frame/render as a transform update.
						// 2) iOS Safari sometimes neglects to repaint elements in their new positions. Setting "WebkitPerspective" to a non-zero value worked too except that on iOS Safari things would flicker randomly.
						// 3) Safari sometimes displayed odd artifacts when tweening the transform (or WebkitTransform) property, like ghosts of the edges of the element remained. Definitely a browser bug.
						//Note: we allow the user to override the auto-setting by defining WebkitBackfaceVisibility in the vars of the tween.
						if (_isSafariLT6) {
							this._addLazySet(style, "WebkitBackfaceVisibility", this._vars.WebkitBackfaceVisibility || (threeD ? "visible" : "hidden"));
						}
					}
					pt2 = pt;
					while (pt2 && pt2._next) {
						pt2 = pt2._next;
					}
					tpt = new CSSPropTween(target, "transform", 0, 0, null, 2);
					this._linkCSSP(tpt, null, pt2);
					tpt.setRatio = _transformProp ? _setTransformRatio : _setIETransformRatio;
					tpt.data = this._transform || _getTransform(target, _cs, true);
					tpt.tween = tween;
					tpt.pr = -1; //ensures that the transforms get applied after the components are updated.
					_overwriteProps.pop(); //we don't want to force the overwrite of all "transform" tweens of the target - we only care about individual transform properties like scaleX, rotation, etc. The CSSPropTween constructor automatically adds the property to _overwriteProps which is why we need to pop() here.
				}

				if (_hasPriority) {
					//reorders the linked list in order of pr (priority)
					while (pt) {
						next = pt._next;
						pt2 = first;
						while (pt2 && pt2.pr > pt.pr) {
							pt2 = pt2._next;
						}
						if (pt._prev = pt2 ? pt2._prev : last) {
							pt._prev._next = pt;
						} else {
							first = pt;
						}
						if (pt._next = pt2) {
							pt2._prev = pt;
						} else {
							last = pt;
						}
						pt = next;
					}
					this._firstPT = first;
				}
				return true;
			};

			p.parse = function (target, vars, pt, plugin) {
				var style = target.style,
				    p,
				    sp,
				    bn,
				    en,
				    bs,
				    es,
				    bsfx,
				    esfx,
				    isStr,
				    rel;
				for (p in vars) {
					es = vars[p]; //ending value string
					sp = _specialProps[p]; //SpecialProp lookup.
					if (sp) {
						pt = sp.parse(target, es, p, this, pt, plugin, vars);
					} else {
						bs = _getStyle(target, p, _cs) + "";
						isStr = typeof es === "string";
						if (p === "color" || p === "fill" || p === "stroke" || p.indexOf("Color") !== -1 || isStr && _rgbhslExp.test(es)) {
							//Opera uses background: to define color sometimes in addition to backgroundColor:
							if (!isStr) {
								es = _parseColor(es);
								es = (es.length > 3 ? "rgba(" : "rgb(") + es.join(",") + ")";
							}
							pt = _parseComplex(style, p, bs, es, true, "transparent", pt, 0, plugin);
						} else if (isStr && (es.indexOf(" ") !== -1 || es.indexOf(",") !== -1)) {
							pt = _parseComplex(style, p, bs, es, true, null, pt, 0, plugin);
						} else {
							bn = parseFloat(bs);
							bsfx = bn || bn === 0 ? bs.substr((bn + "").length) : ""; //remember, bs could be non-numeric like "normal" for fontWeight, so we should default to a blank suffix in that case.

							if (bs === "" || bs === "auto") {
								if (p === "width" || p === "height") {
									bn = _getDimension(target, p, _cs);
									bsfx = "px";
								} else if (p === "left" || p === "top") {
									bn = _calculateOffset(target, p, _cs);
									bsfx = "px";
								} else {
									bn = p !== "opacity" ? 0 : 1;
									bsfx = "";
								}
							}

							rel = isStr && es.charAt(1) === "=";
							if (rel) {
								en = parseInt(es.charAt(0) + "1", 10);
								es = es.substr(2);
								en *= parseFloat(es);
								esfx = es.replace(_suffixExp, "");
							} else {
								en = parseFloat(es);
								esfx = isStr ? es.replace(_suffixExp, "") : "";
							}

							if (esfx === "") {
								esfx = p in _suffixMap ? _suffixMap[p] : bsfx; //populate the end suffix, prioritizing the map, then if none is found, use the beginning suffix.
							}

							es = en || en === 0 ? (rel ? en + bn : en) + esfx : vars[p]; //ensures that any += or -= prefixes are taken care of. Record the end value before normalizing the suffix because we always want to end the tween on exactly what they intended even if it doesn't match the beginning value's suffix.

							//if the beginning/ending suffixes don't match, normalize them...
							if (bsfx !== esfx) if (esfx !== "") if (en || en === 0) if (bn) {
								//note: if the beginning value (bn) is 0, we don't need to convert units!
								bn = _convertToPixels(target, p, bn, bsfx);
								if (esfx === "%") {
									bn /= _convertToPixels(target, p, 100, "%") / 100;
									if (vars.strictUnits !== true) {
										//some browsers report only "px" values instead of allowing "%" with getComputedStyle(), so we assume that if we're tweening to a %, we should start there too unless strictUnits:true is defined. This approach is particularly useful for responsive designs that use from() tweens.
										bs = bn + "%";
									}
								} else if (esfx === "em" || esfx === "rem") {
									bn /= _convertToPixels(target, p, 1, esfx);

									//otherwise convert to pixels.
								} else if (esfx !== "px") {
									en = _convertToPixels(target, p, en, esfx);
									esfx = "px"; //we don't use bsfx after this, so we don't need to set it to px too.
								}
								if (rel) if (en || en === 0) {
									es = en + bn + esfx; //the changes we made affect relative calculations, so adjust the end value here.
								}
							}

							if (rel) {
								en += bn;
							}

							if ((bn || bn === 0) && (en || en === 0)) {
								//faster than isNaN(). Also, previously we required en !== bn but that doesn't really gain much performance and it prevents _parseToProxy() from working properly if beginning and ending values match but need to get tweened by an external plugin anyway. For example, a bezier tween where the target starts at left:0 and has these points: [{left:50},{left:0}] wouldn't work properly because when parsing the last point, it'd match the first (current) one and a non-tweening CSSPropTween would be recorded when we actually need a normal tween (type:0) so that things get updated during the tween properly.
								pt = new CSSPropTween(style, p, bn, en - bn, pt, 0, p, _autoRound !== false && (esfx === "px" || p === "zIndex"), 0, bs, es);
								pt.xs0 = esfx;
								//DEBUG: _log("tween "+p+" from "+pt.b+" ("+bn+esfx+") to "+pt.e+" with suffix: "+pt.xs0);
							} else if (style[p] === undefined || !es && (es + "" === "NaN" || es == null)) {
								_log("invalid " + p + " tween value: " + vars[p]);
							} else {
								pt = new CSSPropTween(style, p, en || bn || 0, 0, pt, -1, p, false, 0, bs, es);
								pt.xs0 = es === "none" && (p === "display" || p.indexOf("Style") !== -1) ? bs : es; //intermediate value should typically be set immediately (end value) except for "display" or things like borderTopStyle, borderBottomStyle, etc. which should use the beginning value during the tween.
								//DEBUG: _log("non-tweening value "+p+": "+pt.xs0);
							}
						}
					}
					if (plugin) if (pt && !pt.plugin) {
						pt.plugin = plugin;
					}
				}
				return pt;
			};

			//gets called every time the tween updates, passing the new ratio (typically a value between 0 and 1, but not always (for example, if an Elastic.easeOut is used, the value can jump above 1 mid-tween). It will always start and 0 and end at 1.
			p.setRatio = function (v) {
				var pt = this._firstPT,
				    min = 0.000001,
				    val,
				    str,
				    i;
				//at the end of the tween, we set the values to exactly what we received in order to make sure non-tweening values (like "position" or "float" or whatever) are set and so that if the beginning/ending suffixes (units) didn't match and we normalized to px, the value that the user passed in is used here. We check to see if the tween is at its beginning in case it's a from() tween in which case the ratio will actually go from 1 to 0 over the course of the tween (backwards).
				if (v === 1 && (this._tween._time === this._tween._duration || this._tween._time === 0)) {
					while (pt) {
						if (pt.type !== 2) {
							if (pt.r && pt.type !== -1) {
								val = Math.round(pt.s + pt.c);
								if (!pt.type) {
									pt.t[pt.p] = val + pt.xs0;
								} else if (pt.type === 1) {
									//complex value (one that typically has multiple numbers inside a string, like "rect(5px,10px,20px,25px)"
									i = pt.l;
									str = pt.xs0 + val + pt.xs1;
									for (i = 1; i < pt.l; i++) {
										str += pt["xn" + i] + pt["xs" + (i + 1)];
									}
									pt.t[pt.p] = str;
								}
							} else {
								pt.t[pt.p] = pt.e;
							}
						} else {
							pt.setRatio(v);
						}
						pt = pt._next;
					}
				} else if (v || !(this._tween._time === this._tween._duration || this._tween._time === 0) || this._tween._rawPrevTime === -0.000001) {
					while (pt) {
						val = pt.c * v + pt.s;
						if (pt.r) {
							val = Math.round(val);
						} else if (val < min) if (val > -min) {
							val = 0;
						}
						if (!pt.type) {
							pt.t[pt.p] = val + pt.xs0;
						} else if (pt.type === 1) {
							//complex value (one that typically has multiple numbers inside a string, like "rect(5px,10px,20px,25px)"
							i = pt.l;
							if (i === 2) {
								pt.t[pt.p] = pt.xs0 + val + pt.xs1 + pt.xn1 + pt.xs2;
							} else if (i === 3) {
								pt.t[pt.p] = pt.xs0 + val + pt.xs1 + pt.xn1 + pt.xs2 + pt.xn2 + pt.xs3;
							} else if (i === 4) {
								pt.t[pt.p] = pt.xs0 + val + pt.xs1 + pt.xn1 + pt.xs2 + pt.xn2 + pt.xs3 + pt.xn3 + pt.xs4;
							} else if (i === 5) {
								pt.t[pt.p] = pt.xs0 + val + pt.xs1 + pt.xn1 + pt.xs2 + pt.xn2 + pt.xs3 + pt.xn3 + pt.xs4 + pt.xn4 + pt.xs5;
							} else {
								str = pt.xs0 + val + pt.xs1;
								for (i = 1; i < pt.l; i++) {
									str += pt["xn" + i] + pt["xs" + (i + 1)];
								}
								pt.t[pt.p] = str;
							}
						} else if (pt.type === -1) {
							//non-tweening value
							pt.t[pt.p] = pt.xs0;
						} else if (pt.setRatio) {
							//custom setRatio() for things like SpecialProps, external plugins, etc.
							pt.setRatio(v);
						}
						pt = pt._next;
					}

					//if the tween is reversed all the way back to the beginning, we need to restore the original values which may have different units (like % instead of px or em or whatever).
				} else {
					while (pt) {
						if (pt.type !== 2) {
							pt.t[pt.p] = pt.b;
						} else {
							pt.setRatio(v);
						}
						pt = pt._next;
					}
				}
			};

			/**
    * @private
    * Forces rendering of the target's transforms (rotation, scale, etc.) whenever the CSSPlugin's setRatio() is called.
    * Basically, this tells the CSSPlugin to create a CSSPropTween (type 2) after instantiation that runs last in the linked
    * list and calls the appropriate (3D or 2D) rendering function. We separate this into its own method so that we can call
    * it from other plugins like BezierPlugin if, for example, it needs to apply an autoRotation and this CSSPlugin
    * doesn't have any transform-related properties of its own. You can call this method as many times as you
    * want and it won't create duplicate CSSPropTweens.
    *
    * @param {boolean} threeD if true, it should apply 3D tweens (otherwise, just 2D ones are fine and typically faster)
    */
			p._enableTransforms = function (threeD) {
				this._transform = this._transform || _getTransform(this._target, _cs, true); //ensures that the element has a _gsTransform property with the appropriate values.
				this._transformType = !(this._transform.svg && _useSVGTransformAttr) && (threeD || this._transformType === 3) ? 3 : 2;
			};

			var lazySet = function (v) {
				this.t[this.p] = this.e;
				this.data._linkCSSP(this, this._next, null, true); //we purposefully keep this._next even though it'd make sense to null it, but this is a performance optimization, as this happens during the while (pt) {} loop in setRatio() at the bottom of which it sets pt = pt._next, so if we null it, the linked list will be broken in that loop.
			};
			/** @private Gives us a way to set a value on the first render (and only the first render). **/
			p._addLazySet = function (t, p, v) {
				var pt = this._firstPT = new CSSPropTween(t, p, 0, 0, this._firstPT, 2);
				pt.e = v;
				pt.setRatio = lazySet;
				pt.data = this;
			};

			/** @private **/
			p._linkCSSP = function (pt, next, prev, remove) {
				if (pt) {
					if (next) {
						next._prev = pt;
					}
					if (pt._next) {
						pt._next._prev = pt._prev;
					}
					if (pt._prev) {
						pt._prev._next = pt._next;
					} else if (this._firstPT === pt) {
						this._firstPT = pt._next;
						remove = true; //just to prevent resetting this._firstPT 5 lines down in case pt._next is null. (optimized for speed)
					}
					if (prev) {
						prev._next = pt;
					} else if (!remove && this._firstPT === null) {
						this._firstPT = pt;
					}
					pt._next = next;
					pt._prev = prev;
				}
				return pt;
			};

			//we need to make sure that if alpha or autoAlpha is killed, opacity is too. And autoAlpha affects the "visibility" property.
			p._kill = function (lookup) {
				var copy = lookup,
				    pt,
				    p,
				    xfirst;
				if (lookup.autoAlpha || lookup.alpha) {
					copy = {};
					for (p in lookup) {
						//copy the lookup so that we're not changing the original which may be passed elsewhere.
						copy[p] = lookup[p];
					}
					copy.opacity = 1;
					if (copy.autoAlpha) {
						copy.visibility = 1;
					}
				}
				if (lookup.className && (pt = this._classNamePT)) {
					//for className tweens, we need to kill any associated CSSPropTweens too; a linked list starts at the className's "xfirst".
					xfirst = pt.xfirst;
					if (xfirst && xfirst._prev) {
						this._linkCSSP(xfirst._prev, pt._next, xfirst._prev._prev); //break off the prev
					} else if (xfirst === this._firstPT) {
						this._firstPT = pt._next;
					}
					if (pt._next) {
						this._linkCSSP(pt._next, pt._next._next, xfirst._prev);
					}
					this._classNamePT = null;
				}
				return TweenPlugin.prototype._kill.call(this, copy);
			};

			//used by cascadeTo() for gathering all the style properties of each child element into an array for comparison.
			var _getChildStyles = function (e, props, targets) {
				var children, i, child, type;
				if (e.slice) {
					i = e.length;
					while (--i > -1) {
						_getChildStyles(e[i], props, targets);
					}
					return;
				}
				children = e.childNodes;
				i = children.length;
				while (--i > -1) {
					child = children[i];
					type = child.type;
					if (child.style) {
						props.push(_getAllStyles(child));
						if (targets) {
							targets.push(child);
						}
					}
					if ((type === 1 || type === 9 || type === 11) && child.childNodes.length) {
						_getChildStyles(child, props, targets);
					}
				}
			};

			/**
    * Typically only useful for className tweens that may affect child elements, this method creates a TweenLite
    * and then compares the style properties of all the target's child elements at the tween's start and end, and
    * if any are different, it also creates tweens for those and returns an array containing ALL of the resulting
    * tweens (so that you can easily add() them to a TimelineLite, for example). The reason this functionality is
    * wrapped into a separate static method of CSSPlugin instead of being integrated into all regular className tweens
    * is because it creates entirely new tweens that may have completely different targets than the original tween,
    * so if they were all lumped into the original tween instance, it would be inconsistent with the rest of the API
    * and it would create other problems. For example:
    *  - If I create a tween of elementA, that tween instance may suddenly change its target to include 50 other elements (unintuitive if I specifically defined the target I wanted)
    *  - We can't just create new independent tweens because otherwise, what happens if the original/parent tween is reversed or pause or dropped into a TimelineLite for tight control? You'd expect that tween's behavior to affect all the others.
    *  - Analyzing every style property of every child before and after the tween is an expensive operation when there are many children, so this behavior shouldn't be imposed on all className tweens by default, especially since it's probably rare that this extra functionality is needed.
    *
    * @param {Object} target object to be tweened
    * @param {number} Duration in seconds (or frames for frames-based tweens)
    * @param {Object} Object containing the end values, like {className:"newClass", ease:Linear.easeNone}
    * @return {Array} An array of TweenLite instances
    */
			CSSPlugin.cascadeTo = function (target, duration, vars) {
				var tween = TweenLite.to(target, duration, vars),
				    results = [tween],
				    b = [],
				    e = [],
				    targets = [],
				    _reservedProps = TweenLite._internals.reservedProps,
				    i,
				    difs,
				    p,
				    from;
				target = tween._targets || tween.target;
				_getChildStyles(target, b, targets);
				tween.render(duration, true, true);
				_getChildStyles(target, e);
				tween.render(0, true, true);
				tween._enabled(true);
				i = targets.length;
				while (--i > -1) {
					difs = _cssDif(targets[i], b[i], e[i]);
					if (difs.firstMPT) {
						difs = difs.difs;
						for (p in vars) {
							if (_reservedProps[p]) {
								difs[p] = vars[p];
							}
						}
						from = {};
						for (p in difs) {
							from[p] = b[i][p];
						}
						results.push(TweenLite.fromTo(targets[i], duration, from, difs));
					}
				}
				return results;
			};

			TweenPlugin.activate([CSSPlugin]);
			return CSSPlugin;
		}, true);

		/*
   * ----------------------------------------------------------------
   * RoundPropsPlugin
   * ----------------------------------------------------------------
   */
		(function () {

			var RoundPropsPlugin = _gsScope._gsDefine.plugin({
				propName: "roundProps",
				version: "1.5",
				priority: -1,
				API: 2,

				//called when the tween renders for the first time. This is where initial values should be recorded and any setup routines should run.
				init: function (target, value, tween) {
					this._tween = tween;
					return true;
				}

			}),
			    _roundLinkedList = function (node) {
				while (node) {
					if (!node.f && !node.blob) {
						node.r = 1;
					}
					node = node._next;
				}
			},
			    p = RoundPropsPlugin.prototype;

			p._onInitAllProps = function () {
				var tween = this._tween,
				    rp = tween.vars.roundProps.join ? tween.vars.roundProps : tween.vars.roundProps.split(","),
				    i = rp.length,
				    lookup = {},
				    rpt = tween._propLookup.roundProps,
				    prop,
				    pt,
				    next;
				while (--i > -1) {
					lookup[rp[i]] = 1;
				}
				i = rp.length;
				while (--i > -1) {
					prop = rp[i];
					pt = tween._firstPT;
					while (pt) {
						next = pt._next; //record here, because it may get removed
						if (pt.pg) {
							pt.t._roundProps(lookup, true);
						} else if (pt.n === prop) {
							if (pt.f === 2 && pt.t) {
								//a blob (text containing multiple numeric values)
								_roundLinkedList(pt.t._firstPT);
							} else {
								this._add(pt.t, prop, pt.s, pt.c);
								//remove from linked list
								if (next) {
									next._prev = pt._prev;
								}
								if (pt._prev) {
									pt._prev._next = next;
								} else if (tween._firstPT === pt) {
									tween._firstPT = next;
								}
								pt._next = pt._prev = null;
								tween._propLookup[prop] = rpt;
							}
						}
						pt = next;
					}
				}
				return false;
			};

			p._add = function (target, p, s, c) {
				this._addTween(target, p, s, s + c, p, true);
				this._overwriteProps.push(p);
			};
		})();

		/*
   * ----------------------------------------------------------------
   * AttrPlugin
   * ----------------------------------------------------------------
   */

		(function () {

			_gsScope._gsDefine.plugin({
				propName: "attr",
				API: 2,
				version: "0.5.0",

				//called when the tween renders for the first time. This is where initial values should be recorded and any setup routines should run.
				init: function (target, value, tween) {
					var p;
					if (typeof target.setAttribute !== "function") {
						return false;
					}
					for (p in value) {
						this._addTween(target, "setAttribute", target.getAttribute(p) + "", value[p] + "", p, false, p);
						this._overwriteProps.push(p);
					}
					return true;
				}

			});
		})();

		/*
   * ----------------------------------------------------------------
   * DirectionalRotationPlugin
   * ----------------------------------------------------------------
   */
		_gsScope._gsDefine.plugin({
			propName: "directionalRotation",
			version: "0.2.1",
			API: 2,

			//called when the tween renders for the first time. This is where initial values should be recorded and any setup routines should run.
			init: function (target, value, tween) {
				if (typeof value !== "object") {
					value = { rotation: value };
				}
				this.finals = {};
				var cap = value.useRadians === true ? Math.PI * 2 : 360,
				    min = 0.000001,
				    p,
				    v,
				    start,
				    end,
				    dif,
				    split;
				for (p in value) {
					if (p !== "useRadians") {
						split = (value[p] + "").split("_");
						v = split[0];
						start = parseFloat(typeof target[p] !== "function" ? target[p] : target[p.indexOf("set") || typeof target["get" + p.substr(3)] !== "function" ? p : "get" + p.substr(3)]());
						end = this.finals[p] = typeof v === "string" && v.charAt(1) === "=" ? start + parseInt(v.charAt(0) + "1", 10) * Number(v.substr(2)) : Number(v) || 0;
						dif = end - start;
						if (split.length) {
							v = split.join("_");
							if (v.indexOf("short") !== -1) {
								dif = dif % cap;
								if (dif !== dif % (cap / 2)) {
									dif = dif < 0 ? dif + cap : dif - cap;
								}
							}
							if (v.indexOf("_cw") !== -1 && dif < 0) {
								dif = (dif + cap * 9999999999) % cap - (dif / cap | 0) * cap;
							} else if (v.indexOf("ccw") !== -1 && dif > 0) {
								dif = (dif - cap * 9999999999) % cap - (dif / cap | 0) * cap;
							}
						}
						if (dif > min || dif < -min) {
							this._addTween(target, p, start, start + dif, p);
							this._overwriteProps.push(p);
						}
					}
				}
				return true;
			},

			//called each time the values should be updated, and the ratio gets passed as the only parameter (typically it's a value between 0 and 1, but it can exceed those when using an ease like Elastic.easeOut or Back.easeOut, etc.)
			set: function (ratio) {
				var pt;
				if (ratio !== 1) {
					this._super.setRatio.call(this, ratio);
				} else {
					pt = this._firstPT;
					while (pt) {
						if (pt.f) {
							pt.t[pt.p](this.finals[pt.p]);
						} else {
							pt.t[pt.p] = this.finals[pt.p];
						}
						pt = pt._next;
					}
				}
			}

		})._autoCSS = true;

		/*
   * ----------------------------------------------------------------
   * EasePack
   * ----------------------------------------------------------------
   */
		_gsScope._gsDefine("easing.Back", ["easing.Ease"], function (Ease) {

			var w = _gsScope.GreenSockGlobals || _gsScope,
			    gs = w.com.greensock,
			    _2PI = Math.PI * 2,
			    _HALF_PI = Math.PI / 2,
			    _class = gs._class,
			    _create = function (n, f) {
				var C = _class("easing." + n, function () {}, true),
				    p = C.prototype = new Ease();
				p.constructor = C;
				p.getRatio = f;
				return C;
			},
			    _easeReg = Ease.register || function () {},
			    //put an empty function in place just as a safety measure in case someone loads an OLD version of TweenLite.js where Ease.register doesn't exist.
			_wrap = function (name, EaseOut, EaseIn, EaseInOut, aliases) {
				var C = _class("easing." + name, {
					easeOut: new EaseOut(),
					easeIn: new EaseIn(),
					easeInOut: new EaseInOut()
				}, true);
				_easeReg(C, name);
				return C;
			},
			    EasePoint = function (time, value, next) {
				this.t = time;
				this.v = value;
				if (next) {
					this.next = next;
					next.prev = this;
					this.c = next.v - value;
					this.gap = next.t - time;
				}
			},


			//Back
			_createBack = function (n, f) {
				var C = _class("easing." + n, function (overshoot) {
					this._p1 = overshoot || overshoot === 0 ? overshoot : 1.70158;
					this._p2 = this._p1 * 1.525;
				}, true),
				    p = C.prototype = new Ease();
				p.constructor = C;
				p.getRatio = f;
				p.config = function (overshoot) {
					return new C(overshoot);
				};
				return C;
			},
			    Back = _wrap("Back", _createBack("BackOut", function (p) {
				return (p = p - 1) * p * ((this._p1 + 1) * p + this._p1) + 1;
			}), _createBack("BackIn", function (p) {
				return p * p * ((this._p1 + 1) * p - this._p1);
			}), _createBack("BackInOut", function (p) {
				return (p *= 2) < 1 ? 0.5 * p * p * ((this._p2 + 1) * p - this._p2) : 0.5 * ((p -= 2) * p * ((this._p2 + 1) * p + this._p2) + 2);
			})),


			//SlowMo
			SlowMo = _class("easing.SlowMo", function (linearRatio, power, yoyoMode) {
				power = power || power === 0 ? power : 0.7;
				if (linearRatio == null) {
					linearRatio = 0.7;
				} else if (linearRatio > 1) {
					linearRatio = 1;
				}
				this._p = linearRatio !== 1 ? power : 0;
				this._p1 = (1 - linearRatio) / 2;
				this._p2 = linearRatio;
				this._p3 = this._p1 + this._p2;
				this._calcEnd = yoyoMode === true;
			}, true),
			    p = SlowMo.prototype = new Ease(),
			    SteppedEase,
			    RoughEase,
			    _createElastic;

			p.constructor = SlowMo;
			p.getRatio = function (p) {
				var r = p + (0.5 - p) * this._p;
				if (p < this._p1) {
					return this._calcEnd ? 1 - (p = 1 - p / this._p1) * p : r - (p = 1 - p / this._p1) * p * p * p * r;
				} else if (p > this._p3) {
					return this._calcEnd ? 1 - (p = (p - this._p3) / this._p1) * p : r + (p - r) * (p = (p - this._p3) / this._p1) * p * p * p;
				}
				return this._calcEnd ? 1 : r;
			};
			SlowMo.ease = new SlowMo(0.7, 0.7);

			p.config = SlowMo.config = function (linearRatio, power, yoyoMode) {
				return new SlowMo(linearRatio, power, yoyoMode);
			};

			//SteppedEase
			SteppedEase = _class("easing.SteppedEase", function (steps) {
				steps = steps || 1;
				this._p1 = 1 / steps;
				this._p2 = steps + 1;
			}, true);
			p = SteppedEase.prototype = new Ease();
			p.constructor = SteppedEase;
			p.getRatio = function (p) {
				if (p < 0) {
					p = 0;
				} else if (p >= 1) {
					p = 0.999999999;
				}
				return (this._p2 * p >> 0) * this._p1;
			};
			p.config = SteppedEase.config = function (steps) {
				return new SteppedEase(steps);
			};

			//RoughEase
			RoughEase = _class("easing.RoughEase", function (vars) {
				vars = vars || {};
				var taper = vars.taper || "none",
				    a = [],
				    cnt = 0,
				    points = (vars.points || 20) | 0,
				    i = points,
				    randomize = vars.randomize !== false,
				    clamp = vars.clamp === true,
				    template = vars.template instanceof Ease ? vars.template : null,
				    strength = typeof vars.strength === "number" ? vars.strength * 0.4 : 0.4,
				    x,
				    y,
				    bump,
				    invX,
				    obj,
				    pnt;
				while (--i > -1) {
					x = randomize ? Math.random() : 1 / points * i;
					y = template ? template.getRatio(x) : x;
					if (taper === "none") {
						bump = strength;
					} else if (taper === "out") {
						invX = 1 - x;
						bump = invX * invX * strength;
					} else if (taper === "in") {
						bump = x * x * strength;
					} else if (x < 0.5) {
						//"both" (start)
						invX = x * 2;
						bump = invX * invX * 0.5 * strength;
					} else {
						//"both" (end)
						invX = (1 - x) * 2;
						bump = invX * invX * 0.5 * strength;
					}
					if (randomize) {
						y += Math.random() * bump - bump * 0.5;
					} else if (i % 2) {
						y += bump * 0.5;
					} else {
						y -= bump * 0.5;
					}
					if (clamp) {
						if (y > 1) {
							y = 1;
						} else if (y < 0) {
							y = 0;
						}
					}
					a[cnt++] = { x: x, y: y };
				}
				a.sort(function (a, b) {
					return a.x - b.x;
				});

				pnt = new EasePoint(1, 1, null);
				i = points;
				while (--i > -1) {
					obj = a[i];
					pnt = new EasePoint(obj.x, obj.y, pnt);
				}

				this._prev = new EasePoint(0, 0, pnt.t !== 0 ? pnt : pnt.next);
			}, true);
			p = RoughEase.prototype = new Ease();
			p.constructor = RoughEase;
			p.getRatio = function (p) {
				var pnt = this._prev;
				if (p > pnt.t) {
					while (pnt.next && p >= pnt.t) {
						pnt = pnt.next;
					}
					pnt = pnt.prev;
				} else {
					while (pnt.prev && p <= pnt.t) {
						pnt = pnt.prev;
					}
				}
				this._prev = pnt;
				return pnt.v + (p - pnt.t) / pnt.gap * pnt.c;
			};
			p.config = function (vars) {
				return new RoughEase(vars);
			};
			RoughEase.ease = new RoughEase();

			//Bounce
			_wrap("Bounce", _create("BounceOut", function (p) {
				if (p < 1 / 2.75) {
					return 7.5625 * p * p;
				} else if (p < 2 / 2.75) {
					return 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;
				} else if (p < 2.5 / 2.75) {
					return 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;
				}
				return 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;
			}), _create("BounceIn", function (p) {
				if ((p = 1 - p) < 1 / 2.75) {
					return 1 - 7.5625 * p * p;
				} else if (p < 2 / 2.75) {
					return 1 - (7.5625 * (p -= 1.5 / 2.75) * p + 0.75);
				} else if (p < 2.5 / 2.75) {
					return 1 - (7.5625 * (p -= 2.25 / 2.75) * p + 0.9375);
				}
				return 1 - (7.5625 * (p -= 2.625 / 2.75) * p + 0.984375);
			}), _create("BounceInOut", function (p) {
				var invert = p < 0.5;
				if (invert) {
					p = 1 - p * 2;
				} else {
					p = p * 2 - 1;
				}
				if (p < 1 / 2.75) {
					p = 7.5625 * p * p;
				} else if (p < 2 / 2.75) {
					p = 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;
				} else if (p < 2.5 / 2.75) {
					p = 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;
				} else {
					p = 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;
				}
				return invert ? (1 - p) * 0.5 : p * 0.5 + 0.5;
			}));

			//CIRC
			_wrap("Circ", _create("CircOut", function (p) {
				return Math.sqrt(1 - (p = p - 1) * p);
			}), _create("CircIn", function (p) {
				return -(Math.sqrt(1 - p * p) - 1);
			}), _create("CircInOut", function (p) {
				return (p *= 2) < 1 ? -0.5 * (Math.sqrt(1 - p * p) - 1) : 0.5 * (Math.sqrt(1 - (p -= 2) * p) + 1);
			}));

			//Elastic
			_createElastic = function (n, f, def) {
				var C = _class("easing." + n, function (amplitude, period) {
					this._p1 = amplitude >= 1 ? amplitude : 1; //note: if amplitude is < 1, we simply adjust the period for a more natural feel. Otherwise the math doesn't work right and the curve starts at 1.
					this._p2 = (period || def) / (amplitude < 1 ? amplitude : 1);
					this._p3 = this._p2 / _2PI * (Math.asin(1 / this._p1) || 0);
					this._p2 = _2PI / this._p2; //precalculate to optimize
				}, true),
				    p = C.prototype = new Ease();
				p.constructor = C;
				p.getRatio = f;
				p.config = function (amplitude, period) {
					return new C(amplitude, period);
				};
				return C;
			};
			_wrap("Elastic", _createElastic("ElasticOut", function (p) {
				return this._p1 * Math.pow(2, -10 * p) * Math.sin((p - this._p3) * this._p2) + 1;
			}, 0.3), _createElastic("ElasticIn", function (p) {
				return -(this._p1 * Math.pow(2, 10 * (p -= 1)) * Math.sin((p - this._p3) * this._p2));
			}, 0.3), _createElastic("ElasticInOut", function (p) {
				return (p *= 2) < 1 ? -0.5 * (this._p1 * Math.pow(2, 10 * (p -= 1)) * Math.sin((p - this._p3) * this._p2)) : this._p1 * Math.pow(2, -10 * (p -= 1)) * Math.sin((p - this._p3) * this._p2) * 0.5 + 1;
			}, 0.45));

			//Expo
			_wrap("Expo", _create("ExpoOut", function (p) {
				return 1 - Math.pow(2, -10 * p);
			}), _create("ExpoIn", function (p) {
				return Math.pow(2, 10 * (p - 1)) - 0.001;
			}), _create("ExpoInOut", function (p) {
				return (p *= 2) < 1 ? 0.5 * Math.pow(2, 10 * (p - 1)) : 0.5 * (2 - Math.pow(2, -10 * (p - 1)));
			}));

			//Sine
			_wrap("Sine", _create("SineOut", function (p) {
				return Math.sin(p * _HALF_PI);
			}), _create("SineIn", function (p) {
				return -Math.cos(p * _HALF_PI) + 1;
			}), _create("SineInOut", function (p) {
				return -0.5 * (Math.cos(Math.PI * p) - 1);
			}));

			_class("easing.EaseLookup", {
				find: function (s) {
					return Ease.map[s];
				}
			}, true);

			//register the non-standard eases
			_easeReg(w.SlowMo, "SlowMo", "ease,");
			_easeReg(RoughEase, "RoughEase", "ease,");
			_easeReg(SteppedEase, "SteppedEase", "ease,");

			return Back;
		}, true);
	});

	if (_gsScope._gsDefine) {
		_gsScope._gsQueue.pop()();
	} //necessary in case TweenLite was already loaded separately.


	/*
  * ----------------------------------------------------------------
  * Base classes like TweenLite, SimpleTimeline, Ease, Ticker, etc.
  * ----------------------------------------------------------------
  */
	(function (window, moduleName) {

		"use strict";

		var _globals = window.GreenSockGlobals = window.GreenSockGlobals || window;
		if (_globals.TweenLite) {
			return; //in case the core set of classes is already loaded, don't instantiate twice.
		}
		var _namespace = function (ns) {
			var a = ns.split("."),
			    p = _globals,
			    i;
			for (i = 0; i < a.length; i++) {
				p[a[i]] = p = p[a[i]] || {};
			}
			return p;
		},
		    gs = _namespace("com.greensock"),
		    _tinyNum = 0.0000000001,
		    _slice = function (a) {
			//don't use Array.prototype.slice.call(target, 0) because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
			var b = [],
			    l = a.length,
			    i;
			for (i = 0; i !== l; b.push(a[i++])) {}
			return b;
		},
		    _emptyFunc = function () {},
		    _isArray = function () {
			//works around issues in iframe environments where the Array global isn't shared, thus if the object originates in a different window/iframe, "(obj instanceof Array)" will evaluate false. We added some speed optimizations to avoid Object.prototype.toString.call() unless it's absolutely necessary because it's VERY slow (like 20x slower)
			var toString = Object.prototype.toString,
			    array = toString.call([]);
			return function (obj) {
				return obj != null && (obj instanceof Array || typeof obj === "object" && !!obj.push && toString.call(obj) === array);
			};
		}(),
		    a,
		    i,
		    p,
		    _ticker,
		    _tickerActive,
		    _defLookup = {},


		/**
   * @constructor
   * Defines a GreenSock class, optionally with an array of dependencies that must be instantiated first and passed into the definition.
   * This allows users to load GreenSock JS files in any order even if they have interdependencies (like CSSPlugin extends TweenPlugin which is
   * inside TweenLite.js, but if CSSPlugin is loaded first, it should wait to run its code until TweenLite.js loads and instantiates TweenPlugin
   * and then pass TweenPlugin to CSSPlugin's definition). This is all done automatically and internally.
   *
   * Every definition will be added to a "com.greensock" global object (typically window, but if a window.GreenSockGlobals object is found,
   * it will go there as of v1.7). For example, TweenLite will be found at window.com.greensock.TweenLite and since it's a global class that should be available anywhere,
   * it is ALSO referenced at window.TweenLite. However some classes aren't considered global, like the base com.greensock.core.Animation class, so
   * those will only be at the package like window.com.greensock.core.Animation. Again, if you define a GreenSockGlobals object on the window, everything
   * gets tucked neatly inside there instead of on the window directly. This allows you to do advanced things like load multiple versions of GreenSock
   * files and put them into distinct objects (imagine a banner ad uses a newer version but the main site uses an older one). In that case, you could
   * sandbox the banner one like:
   *
   * <script>
   *     var gs = window.GreenSockGlobals = {}; //the newer version we're about to load could now be referenced in a "gs" object, like gs.TweenLite.to(...). Use whatever alias you want as long as it's unique, "gs" or "banner" or whatever.
   * </script>
   * <script src="js/greensock/v1.7/TweenMax.js"></script>
   * <script>
   *     window.GreenSockGlobals = window._gsQueue = window._gsDefine = null; //reset it back to null (along with the special _gsQueue variable) so that the next load of TweenMax affects the window and we can reference things directly like TweenLite.to(...)
   * </script>
   * <script src="js/greensock/v1.6/TweenMax.js"></script>
   * <script>
   *     gs.TweenLite.to(...); //would use v1.7
   *     TweenLite.to(...); //would use v1.6
   * </script>
   *
   * @param {!string} ns The namespace of the class definition, leaving off "com.greensock." as that's assumed. For example, "TweenLite" or "plugins.CSSPlugin" or "easing.Back".
   * @param {!Array.<string>} dependencies An array of dependencies (described as their namespaces minus "com.greensock." prefix). For example ["TweenLite","plugins.TweenPlugin","core.Animation"]
   * @param {!function():Object} func The function that should be called and passed the resolved dependencies which will return the actual class for this definition.
   * @param {boolean=} global If true, the class will be added to the global scope (typically window unless you define a window.GreenSockGlobals object)
   */
		Definition = function (ns, dependencies, func, global) {
			this.sc = _defLookup[ns] ? _defLookup[ns].sc : []; //subclasses
			_defLookup[ns] = this;
			this.gsClass = null;
			this.func = func;
			var _classes = [];
			this.check = function (init) {
				var i = dependencies.length,
				    missing = i,
				    cur,
				    a,
				    n,
				    cl,
				    hasModule;
				while (--i > -1) {
					if ((cur = _defLookup[dependencies[i]] || new Definition(dependencies[i], [])).gsClass) {
						_classes[i] = cur.gsClass;
						missing--;
					} else if (init) {
						cur.sc.push(this);
					}
				}
				if (missing === 0 && func) {
					a = ("com.greensock." + ns).split(".");
					n = a.pop();
					cl = _namespace(a.join("."))[n] = this.gsClass = func.apply(func, _classes);

					//exports to multiple environments
					if (global) {
						_globals[n] = cl; //provides a way to avoid global namespace pollution. By default, the main classes like TweenLite, Power1, Strong, etc. are added to window unless a GreenSockGlobals is defined. So if you want to have things added to a custom object instead, just do something like window.GreenSockGlobals = {} before loading any GreenSock files. You can even set up an alias like window.GreenSockGlobals = windows.gs = {} so that you can access everything like gs.TweenLite. Also remember that ALL classes are added to the window.com.greensock object (in their respective packages, like com.greensock.easing.Power1, com.greensock.TweenLite, etc.)
						hasModule = typeof module !== "undefined" && module.exports;
						if (!hasModule && typeof undefined === "function" && define.amd) {
							//AMD
							define((window.GreenSockAMDPath ? window.GreenSockAMDPath + "/" : "") + ns.split(".").pop(), [], function () {
								return cl;
							});
						} else if (ns === moduleName && hasModule) {
							//node
							module.exports = cl;
						}
					}
					for (i = 0; i < this.sc.length; i++) {
						this.sc[i].check();
					}
				}
			};
			this.check(true);
		},


		//used to create Definition instances (which basically registers a class that has dependencies).
		_gsDefine = window._gsDefine = function (ns, dependencies, func, global) {
			return new Definition(ns, dependencies, func, global);
		},


		//a quick way to create a class that doesn't have any dependencies. Returns the class, but first registers it in the GreenSock namespace so that other classes can grab it (other classes might be dependent on the class).
		_class = gs._class = function (ns, func, global) {
			func = func || function () {};
			_gsDefine(ns, [], function () {
				return func;
			}, global);
			return func;
		};

		_gsDefine.globals = _globals;

		/*
   * ----------------------------------------------------------------
   * Ease
   * ----------------------------------------------------------------
   */
		var _baseParams = [0, 0, 1, 1],
		    _blankArray = [],
		    Ease = _class("easing.Ease", function (func, extraParams, type, power) {
			this._func = func;
			this._type = type || 0;
			this._power = power || 0;
			this._params = extraParams ? _baseParams.concat(extraParams) : _baseParams;
		}, true),
		    _easeMap = Ease.map = {},
		    _easeReg = Ease.register = function (ease, names, types, create) {
			var na = names.split(","),
			    i = na.length,
			    ta = (types || "easeIn,easeOut,easeInOut").split(","),
			    e,
			    name,
			    j,
			    type;
			while (--i > -1) {
				name = na[i];
				e = create ? _class("easing." + name, null, true) : gs.easing[name] || {};
				j = ta.length;
				while (--j > -1) {
					type = ta[j];
					_easeMap[name + "." + type] = _easeMap[type + name] = e[type] = ease.getRatio ? ease : ease[type] || new ease();
				}
			}
		};

		p = Ease.prototype;
		p._calcEnd = false;
		p.getRatio = function (p) {
			if (this._func) {
				this._params[0] = p;
				return this._func.apply(null, this._params);
			}
			var t = this._type,
			    pw = this._power,
			    r = t === 1 ? 1 - p : t === 2 ? p : p < 0.5 ? p * 2 : (1 - p) * 2;
			if (pw === 1) {
				r *= r;
			} else if (pw === 2) {
				r *= r * r;
			} else if (pw === 3) {
				r *= r * r * r;
			} else if (pw === 4) {
				r *= r * r * r * r;
			}
			return t === 1 ? 1 - r : t === 2 ? r : p < 0.5 ? r / 2 : 1 - r / 2;
		};

		//create all the standard eases like Linear, Quad, Cubic, Quart, Quint, Strong, Power0, Power1, Power2, Power3, and Power4 (each with easeIn, easeOut, and easeInOut)
		a = ["Linear", "Quad", "Cubic", "Quart", "Quint,Strong"];
		i = a.length;
		while (--i > -1) {
			p = a[i] + ",Power" + i;
			_easeReg(new Ease(null, null, 1, i), p, "easeOut", true);
			_easeReg(new Ease(null, null, 2, i), p, "easeIn" + (i === 0 ? ",easeNone" : ""));
			_easeReg(new Ease(null, null, 3, i), p, "easeInOut");
		}
		_easeMap.linear = gs.easing.Linear.easeIn;
		_easeMap.swing = gs.easing.Quad.easeInOut; //for jQuery folks


		/*
   * ----------------------------------------------------------------
   * EventDispatcher
   * ----------------------------------------------------------------
   */
		var EventDispatcher = _class("events.EventDispatcher", function (target) {
			this._listeners = {};
			this._eventTarget = target || this;
		});
		p = EventDispatcher.prototype;

		p.addEventListener = function (type, callback, scope, useParam, priority) {
			priority = priority || 0;
			var list = this._listeners[type],
			    index = 0,
			    listener,
			    i;
			if (list == null) {
				this._listeners[type] = list = [];
			}
			i = list.length;
			while (--i > -1) {
				listener = list[i];
				if (listener.c === callback && listener.s === scope) {
					list.splice(i, 1);
				} else if (index === 0 && listener.pr < priority) {
					index = i + 1;
				}
			}
			list.splice(index, 0, { c: callback, s: scope, up: useParam, pr: priority });
			if (this === _ticker && !_tickerActive) {
				_ticker.wake();
			}
		};

		p.removeEventListener = function (type, callback) {
			var list = this._listeners[type],
			    i;
			if (list) {
				i = list.length;
				while (--i > -1) {
					if (list[i].c === callback) {
						list.splice(i, 1);
						return;
					}
				}
			}
		};

		p.dispatchEvent = function (type) {
			var list = this._listeners[type],
			    i,
			    t,
			    listener;
			if (list) {
				i = list.length;
				t = this._eventTarget;
				while (--i > -1) {
					listener = list[i];
					if (listener) {
						if (listener.up) {
							listener.c.call(listener.s || t, { type: type, target: t });
						} else {
							listener.c.call(listener.s || t);
						}
					}
				}
			}
		};

		/*
   * ----------------------------------------------------------------
   * Ticker
   * ----------------------------------------------------------------
   */
		var _reqAnimFrame = window.requestAnimationFrame,
		    _cancelAnimFrame = window.cancelAnimationFrame,
		    _getTime = Date.now || function () {
			return new Date().getTime();
		},
		    _lastUpdate = _getTime();

		//now try to determine the requestAnimationFrame and cancelAnimationFrame functions and if none are found, we'll use a setTimeout()/clearTimeout() polyfill.
		a = ["ms", "moz", "webkit", "o"];
		i = a.length;
		while (--i > -1 && !_reqAnimFrame) {
			_reqAnimFrame = window[a[i] + "RequestAnimationFrame"];
			_cancelAnimFrame = window[a[i] + "CancelAnimationFrame"] || window[a[i] + "CancelRequestAnimationFrame"];
		}

		_class("Ticker", function (fps, useRAF) {
			var _self = this,
			    _startTime = _getTime(),
			    _useRAF = useRAF !== false && _reqAnimFrame,
			    _lagThreshold = 500,
			    _adjustedLag = 33,
			    _tickWord = "tick",
			    //helps reduce gc burden
			_fps,
			    _req,
			    _id,
			    _gap,
			    _nextTime,
			    _tick = function (manual) {
				var elapsed = _getTime() - _lastUpdate,
				    overlap,
				    dispatch;
				if (elapsed > _lagThreshold) {
					_startTime += elapsed - _adjustedLag;
				}
				_lastUpdate += elapsed;
				_self.time = (_lastUpdate - _startTime) / 1000;
				overlap = _self.time - _nextTime;
				if (!_fps || overlap > 0 || manual === true) {
					_self.frame++;
					_nextTime += overlap + (overlap >= _gap ? 0.004 : _gap - overlap);
					dispatch = true;
				}
				if (manual !== true) {
					//make sure the request is made before we dispatch the "tick" event so that timing is maintained. Otherwise, if processing the "tick" requires a bunch of time (like 15ms) and we're using a setTimeout() that's based on 16.7ms, it'd technically take 31.7ms between frames otherwise.
					_id = _req(_tick);
				}
				if (dispatch) {
					_self.dispatchEvent(_tickWord);
				}
			};

			EventDispatcher.call(_self);
			_self.time = _self.frame = 0;
			_self.tick = function () {
				_tick(true);
			};

			_self.lagSmoothing = function (threshold, adjustedLag) {
				_lagThreshold = threshold || 1 / _tinyNum; //zero should be interpreted as basically unlimited
				_adjustedLag = Math.min(adjustedLag, _lagThreshold, 0);
			};

			_self.sleep = function () {
				if (_id == null) {
					return;
				}
				if (!_useRAF || !_cancelAnimFrame) {
					clearTimeout(_id);
				} else {
					_cancelAnimFrame(_id);
				}
				_req = _emptyFunc;
				_id = null;
				if (_self === _ticker) {
					_tickerActive = false;
				}
			};

			_self.wake = function () {
				if (_id !== null) {
					_self.sleep();
				} else if (_self.frame > 10) {
					//don't trigger lagSmoothing if we're just waking up, and make sure that at least 10 frames have elapsed because of the iOS bug that we work around below with the 1.5-second setTimout().
					_lastUpdate = _getTime() - _lagThreshold + 5;
				}
				_req = _fps === 0 ? _emptyFunc : !_useRAF || !_reqAnimFrame ? function (f) {
					return setTimeout(f, (_nextTime - _self.time) * 1000 + 1 | 0);
				} : _reqAnimFrame;
				if (_self === _ticker) {
					_tickerActive = true;
				}
				_tick(2);
			};

			_self.fps = function (value) {
				if (!arguments.length) {
					return _fps;
				}
				_fps = value;
				_gap = 1 / (_fps || 60);
				_nextTime = this.time + _gap;
				_self.wake();
			};

			_self.useRAF = function (value) {
				if (!arguments.length) {
					return _useRAF;
				}
				_self.sleep();
				_useRAF = value;
				_self.fps(_fps);
			};
			_self.fps(fps);

			//a bug in iOS 6 Safari occasionally prevents the requestAnimationFrame from working initially, so we use a 1.5-second timeout that automatically falls back to setTimeout() if it senses this condition.
			setTimeout(function () {
				if (_useRAF && _self.frame < 5) {
					_self.useRAF(false);
				}
			}, 1500);
		});

		p = gs.Ticker.prototype = new gs.events.EventDispatcher();
		p.constructor = gs.Ticker;

		/*
   * ----------------------------------------------------------------
   * Animation
   * ----------------------------------------------------------------
   */
		var Animation = _class("core.Animation", function (duration, vars) {
			this.vars = vars = vars || {};
			this._duration = this._totalDuration = duration || 0;
			this._delay = Number(vars.delay) || 0;
			this._timeScale = 1;
			this._active = vars.immediateRender === true;
			this.data = vars.data;
			this._reversed = vars.reversed === true;

			if (!_rootTimeline) {
				return;
			}
			if (!_tickerActive) {
				//some browsers (like iOS 6 Safari) shut down JavaScript execution when the tab is disabled and they [occasionally] neglect to start up requestAnimationFrame again when returning - this code ensures that the engine starts up again properly.
				_ticker.wake();
			}

			var tl = this.vars.useFrames ? _rootFramesTimeline : _rootTimeline;
			tl.add(this, tl._time);

			if (this.vars.paused) {
				this.paused(true);
			}
		});

		_ticker = Animation.ticker = new gs.Ticker();
		p = Animation.prototype;
		p._dirty = p._gc = p._initted = p._paused = false;
		p._totalTime = p._time = 0;
		p._rawPrevTime = -1;
		p._next = p._last = p._onUpdate = p._timeline = p.timeline = null;
		p._paused = false;

		//some browsers (like iOS) occasionally drop the requestAnimationFrame event when the user switches to a different tab and then comes back again, so we use a 2-second setTimeout() to sense if/when that condition occurs and then wake() the ticker.
		var _checkTimeout = function () {
			if (_tickerActive && _getTime() - _lastUpdate > 2000) {
				_ticker.wake();
			}
			setTimeout(_checkTimeout, 2000);
		};
		_checkTimeout();

		p.play = function (from, suppressEvents) {
			if (from != null) {
				this.seek(from, suppressEvents);
			}
			return this.reversed(false).paused(false);
		};

		p.pause = function (atTime, suppressEvents) {
			if (atTime != null) {
				this.seek(atTime, suppressEvents);
			}
			return this.paused(true);
		};

		p.resume = function (from, suppressEvents) {
			if (from != null) {
				this.seek(from, suppressEvents);
			}
			return this.paused(false);
		};

		p.seek = function (time, suppressEvents) {
			return this.totalTime(Number(time), suppressEvents !== false);
		};

		p.restart = function (includeDelay, suppressEvents) {
			return this.reversed(false).paused(false).totalTime(includeDelay ? -this._delay : 0, suppressEvents !== false, true);
		};

		p.reverse = function (from, suppressEvents) {
			if (from != null) {
				this.seek(from || this.totalDuration(), suppressEvents);
			}
			return this.reversed(true).paused(false);
		};

		p.render = function (time, suppressEvents, force) {
			//stub - we override this method in subclasses.
		};

		p.invalidate = function () {
			this._time = this._totalTime = 0;
			this._initted = this._gc = false;
			this._rawPrevTime = -1;
			if (this._gc || !this.timeline) {
				this._enabled(true);
			}
			return this;
		};

		p.isActive = function () {
			var tl = this._timeline,
			    //the 2 root timelines won't have a _timeline; they're always active.
			startTime = this._startTime,
			    rawTime;
			return !tl || !this._gc && !this._paused && tl.isActive() && (rawTime = tl.rawTime()) >= startTime && rawTime < startTime + this.totalDuration() / this._timeScale;
		};

		p._enabled = function (enabled, ignoreTimeline) {
			if (!_tickerActive) {
				_ticker.wake();
			}
			this._gc = !enabled;
			this._active = this.isActive();
			if (ignoreTimeline !== true) {
				if (enabled && !this.timeline) {
					this._timeline.add(this, this._startTime - this._delay);
				} else if (!enabled && this.timeline) {
					this._timeline._remove(this, true);
				}
			}
			return false;
		};

		p._kill = function (vars, target) {
			return this._enabled(false, false);
		};

		p.kill = function (vars, target) {
			this._kill(vars, target);
			return this;
		};

		p._uncache = function (includeSelf) {
			var tween = includeSelf ? this : this.timeline;
			while (tween) {
				tween._dirty = true;
				tween = tween.timeline;
			}
			return this;
		};

		p._swapSelfInParams = function (params) {
			var i = params.length,
			    copy = params.concat();
			while (--i > -1) {
				if (params[i] === "{self}") {
					copy[i] = this;
				}
			}
			return copy;
		};

		p._callback = function (type) {
			var v = this.vars;
			v[type].apply(v[type + "Scope"] || v.callbackScope || this, v[type + "Params"] || _blankArray);
		};

		//----Animation getters/setters --------------------------------------------------------

		p.eventCallback = function (type, callback, params, scope) {
			if ((type || "").substr(0, 2) === "on") {
				var v = this.vars;
				if (arguments.length === 1) {
					return v[type];
				}
				if (callback == null) {
					delete v[type];
				} else {
					v[type] = callback;
					v[type + "Params"] = _isArray(params) && params.join("").indexOf("{self}") !== -1 ? this._swapSelfInParams(params) : params;
					v[type + "Scope"] = scope;
				}
				if (type === "onUpdate") {
					this._onUpdate = callback;
				}
			}
			return this;
		};

		p.delay = function (value) {
			if (!arguments.length) {
				return this._delay;
			}
			if (this._timeline.smoothChildTiming) {
				this.startTime(this._startTime + value - this._delay);
			}
			this._delay = value;
			return this;
		};

		p.duration = function (value) {
			if (!arguments.length) {
				this._dirty = false;
				return this._duration;
			}
			this._duration = this._totalDuration = value;
			this._uncache(true); //true in case it's a TweenMax or TimelineMax that has a repeat - we'll need to refresh the totalDuration.
			if (this._timeline.smoothChildTiming) if (this._time > 0) if (this._time < this._duration) if (value !== 0) {
				this.totalTime(this._totalTime * (value / this._duration), true);
			}
			return this;
		};

		p.totalDuration = function (value) {
			this._dirty = false;
			return !arguments.length ? this._totalDuration : this.duration(value);
		};

		p.time = function (value, suppressEvents) {
			if (!arguments.length) {
				return this._time;
			}
			if (this._dirty) {
				this.totalDuration();
			}
			return this.totalTime(value > this._duration ? this._duration : value, suppressEvents);
		};

		p.totalTime = function (time, suppressEvents, uncapped) {
			if (!_tickerActive) {
				_ticker.wake();
			}
			if (!arguments.length) {
				return this._totalTime;
			}
			if (this._timeline) {
				if (time < 0 && !uncapped) {
					time += this.totalDuration();
				}
				if (this._timeline.smoothChildTiming) {
					if (this._dirty) {
						this.totalDuration();
					}
					var totalDuration = this._totalDuration,
					    tl = this._timeline;
					if (time > totalDuration && !uncapped) {
						time = totalDuration;
					}
					this._startTime = (this._paused ? this._pauseTime : tl._time) - (!this._reversed ? time : totalDuration - time) / this._timeScale;
					if (!tl._dirty) {
						//for performance improvement. If the parent's cache is already dirty, it already took care of marking the ancestors as dirty too, so skip the function call here.
						this._uncache(false);
					}
					//in case any of the ancestor timelines had completed but should now be enabled, we should reset their totalTime() which will also ensure that they're lined up properly and enabled. Skip for animations that are on the root (wasteful). Example: a TimelineLite.exportRoot() is performed when there's a paused tween on the root, the export will not complete until that tween is unpaused, but imagine a child gets restarted later, after all [unpaused] tweens have completed. The startTime of that child would get pushed out, but one of the ancestors may have completed.
					if (tl._timeline) {
						while (tl._timeline) {
							if (tl._timeline._time !== (tl._startTime + tl._totalTime) / tl._timeScale) {
								tl.totalTime(tl._totalTime, true);
							}
							tl = tl._timeline;
						}
					}
				}
				if (this._gc) {
					this._enabled(true, false);
				}
				if (this._totalTime !== time || this._duration === 0) {
					if (_lazyTweens.length) {
						_lazyRender();
					}
					this.render(time, suppressEvents, false);
					if (_lazyTweens.length) {
						//in case rendering caused any tweens to lazy-init, we should render them because typically when someone calls seek() or time() or progress(), they expect an immediate render.
						_lazyRender();
					}
				}
			}
			return this;
		};

		p.progress = p.totalProgress = function (value, suppressEvents) {
			var duration = this.duration();
			return !arguments.length ? duration ? this._time / duration : this.ratio : this.totalTime(duration * value, suppressEvents);
		};

		p.startTime = function (value) {
			if (!arguments.length) {
				return this._startTime;
			}
			if (value !== this._startTime) {
				this._startTime = value;
				if (this.timeline) if (this.timeline._sortChildren) {
					this.timeline.add(this, value - this._delay); //ensures that any necessary re-sequencing of Animations in the timeline occurs to make sure the rendering order is correct.
				}
			}
			return this;
		};

		p.endTime = function (includeRepeats) {
			return this._startTime + (includeRepeats != false ? this.totalDuration() : this.duration()) / this._timeScale;
		};

		p.timeScale = function (value) {
			if (!arguments.length) {
				return this._timeScale;
			}
			value = value || _tinyNum; //can't allow zero because it'll throw the math off
			if (this._timeline && this._timeline.smoothChildTiming) {
				var pauseTime = this._pauseTime,
				    t = pauseTime || pauseTime === 0 ? pauseTime : this._timeline.totalTime();
				this._startTime = t - (t - this._startTime) * this._timeScale / value;
			}
			this._timeScale = value;
			return this._uncache(false);
		};

		p.reversed = function (value) {
			if (!arguments.length) {
				return this._reversed;
			}
			if (value != this._reversed) {
				this._reversed = value;
				this.totalTime(this._timeline && !this._timeline.smoothChildTiming ? this.totalDuration() - this._totalTime : this._totalTime, true);
			}
			return this;
		};

		p.paused = function (value) {
			if (!arguments.length) {
				return this._paused;
			}
			var tl = this._timeline,
			    raw,
			    elapsed;
			if (value != this._paused) if (tl) {
				if (!_tickerActive && !value) {
					_ticker.wake();
				}
				raw = tl.rawTime();
				elapsed = raw - this._pauseTime;
				if (!value && tl.smoothChildTiming) {
					this._startTime += elapsed;
					this._uncache(false);
				}
				this._pauseTime = value ? raw : null;
				this._paused = value;
				this._active = this.isActive();
				if (!value && elapsed !== 0 && this._initted && this.duration()) {
					raw = tl.smoothChildTiming ? this._totalTime : (raw - this._startTime) / this._timeScale;
					this.render(raw, raw === this._totalTime, true); //in case the target's properties changed via some other tween or manual update by the user, we should force a render.
				}
			}
			if (this._gc && !value) {
				this._enabled(true, false);
			}
			return this;
		};

		/*
   * ----------------------------------------------------------------
   * SimpleTimeline
   * ----------------------------------------------------------------
   */
		var SimpleTimeline = _class("core.SimpleTimeline", function (vars) {
			Animation.call(this, 0, vars);
			this.autoRemoveChildren = this.smoothChildTiming = true;
		});

		p = SimpleTimeline.prototype = new Animation();
		p.constructor = SimpleTimeline;
		p.kill()._gc = false;
		p._first = p._last = p._recent = null;
		p._sortChildren = false;

		p.add = p.insert = function (child, position, align, stagger) {
			var prevTween, st;
			child._startTime = Number(position || 0) + child._delay;
			if (child._paused) if (this !== child._timeline) {
				//we only adjust the _pauseTime if it wasn't in this timeline already. Remember, sometimes a tween will be inserted again into the same timeline when its startTime is changed so that the tweens in the TimelineLite/Max are re-ordered properly in the linked list (so everything renders in the proper order).
				child._pauseTime = child._startTime + (this.rawTime() - child._startTime) / child._timeScale;
			}
			if (child.timeline) {
				child.timeline._remove(child, true); //removes from existing timeline so that it can be properly added to this one.
			}
			child.timeline = child._timeline = this;
			if (child._gc) {
				child._enabled(true, true);
			}
			prevTween = this._last;
			if (this._sortChildren) {
				st = child._startTime;
				while (prevTween && prevTween._startTime > st) {
					prevTween = prevTween._prev;
				}
			}
			if (prevTween) {
				child._next = prevTween._next;
				prevTween._next = child;
			} else {
				child._next = this._first;
				this._first = child;
			}
			if (child._next) {
				child._next._prev = child;
			} else {
				this._last = child;
			}
			child._prev = prevTween;
			this._recent = child;
			if (this._timeline) {
				this._uncache(true);
			}
			return this;
		};

		p._remove = function (tween, skipDisable) {
			if (tween.timeline === this) {
				if (!skipDisable) {
					tween._enabled(false, true);
				}

				if (tween._prev) {
					tween._prev._next = tween._next;
				} else if (this._first === tween) {
					this._first = tween._next;
				}
				if (tween._next) {
					tween._next._prev = tween._prev;
				} else if (this._last === tween) {
					this._last = tween._prev;
				}
				tween._next = tween._prev = tween.timeline = null;
				if (tween === this._recent) {
					this._recent = this._last;
				}

				if (this._timeline) {
					this._uncache(true);
				}
			}
			return this;
		};

		p.render = function (time, suppressEvents, force) {
			var tween = this._first,
			    next;
			this._totalTime = this._time = this._rawPrevTime = time;
			while (tween) {
				next = tween._next; //record it here because the value could change after rendering...
				if (tween._active || time >= tween._startTime && !tween._paused) {
					if (!tween._reversed) {
						tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
					} else {
						tween.render((!tween._dirty ? tween._totalDuration : tween.totalDuration()) - (time - tween._startTime) * tween._timeScale, suppressEvents, force);
					}
				}
				tween = next;
			}
		};

		p.rawTime = function () {
			if (!_tickerActive) {
				_ticker.wake();
			}
			return this._totalTime;
		};

		/*
   * ----------------------------------------------------------------
   * TweenLite
   * ----------------------------------------------------------------
   */
		var TweenLite = _class("TweenLite", function (target, duration, vars) {
			Animation.call(this, duration, vars);
			this.render = TweenLite.prototype.render; //speed optimization (avoid prototype lookup on this "hot" method)

			if (target == null) {
				throw "Cannot tween a null target.";
			}

			this.target = target = typeof target !== "string" ? target : TweenLite.selector(target) || target;

			var isSelector = target.jquery || target.length && target !== window && target[0] && (target[0] === window || target[0].nodeType && target[0].style && !target.nodeType),
			    overwrite = this.vars.overwrite,
			    i,
			    targ,
			    targets;

			this._overwrite = overwrite = overwrite == null ? _overwriteLookup[TweenLite.defaultOverwrite] : typeof overwrite === "number" ? overwrite >> 0 : _overwriteLookup[overwrite];

			if ((isSelector || target instanceof Array || target.push && _isArray(target)) && typeof target[0] !== "number") {
				this._targets = targets = _slice(target); //don't use Array.prototype.slice.call(target, 0) because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
				this._propLookup = [];
				this._siblings = [];
				for (i = 0; i < targets.length; i++) {
					targ = targets[i];
					if (!targ) {
						targets.splice(i--, 1);
						continue;
					} else if (typeof targ === "string") {
						targ = targets[i--] = TweenLite.selector(targ); //in case it's an array of strings
						if (typeof targ === "string") {
							targets.splice(i + 1, 1); //to avoid an endless loop (can't imagine why the selector would return a string, but just in case)
						}
						continue;
					} else if (targ.length && targ !== window && targ[0] && (targ[0] === window || targ[0].nodeType && targ[0].style && !targ.nodeType)) {
						//in case the user is passing in an array of selector objects (like jQuery objects), we need to check one more level and pull things out if necessary. Also note that <select> elements pass all the criteria regarding length and the first child having style, so we must also check to ensure the target isn't an HTML node itself.
						targets.splice(i--, 1);
						this._targets = targets = targets.concat(_slice(targ));
						continue;
					}
					this._siblings[i] = _register(targ, this, false);
					if (overwrite === 1) if (this._siblings[i].length > 1) {
						_applyOverwrite(targ, this, null, 1, this._siblings[i]);
					}
				}
			} else {
				this._propLookup = {};
				this._siblings = _register(target, this, false);
				if (overwrite === 1) if (this._siblings.length > 1) {
					_applyOverwrite(target, this, null, 1, this._siblings);
				}
			}
			if (this.vars.immediateRender || duration === 0 && this._delay === 0 && this.vars.immediateRender !== false) {
				this._time = -_tinyNum; //forces a render without having to set the render() "force" parameter to true because we want to allow lazying by default (using the "force" parameter always forces an immediate full render)
				this.render(-this._delay);
			}
		}, true),
		    _isSelector = function (v) {
			return v && v.length && v !== window && v[0] && (v[0] === window || v[0].nodeType && v[0].style && !v.nodeType); //we cannot check "nodeType" if the target is window from within an iframe, otherwise it will trigger a security error in some browsers like Firefox.
		},
		    _autoCSS = function (vars, target) {
			var css = {},
			    p;
			for (p in vars) {
				if (!_reservedProps[p] && (!(p in target) || p === "transform" || p === "x" || p === "y" || p === "width" || p === "height" || p === "className" || p === "border") && (!_plugins[p] || _plugins[p] && _plugins[p]._autoCSS)) {
					//note: <img> elements contain read-only "x" and "y" properties. We should also prioritize editing css width/height rather than the element's properties.
					css[p] = vars[p];
					delete vars[p];
				}
			}
			vars.css = css;
		};

		p = TweenLite.prototype = new Animation();
		p.constructor = TweenLite;
		p.kill()._gc = false;

		//----TweenLite defaults, overwrite management, and root updates ----------------------------------------------------

		p.ratio = 0;
		p._firstPT = p._targets = p._overwrittenProps = p._startAt = null;
		p._notifyPluginsOfEnabled = p._lazy = false;

		TweenLite.version = "1.18.0";
		TweenLite.defaultEase = p._ease = new Ease(null, null, 1, 1);
		TweenLite.defaultOverwrite = "auto";
		TweenLite.ticker = _ticker;
		TweenLite.autoSleep = 120;
		TweenLite.lagSmoothing = function (threshold, adjustedLag) {
			_ticker.lagSmoothing(threshold, adjustedLag);
		};

		TweenLite.selector = window.$ || window.jQuery || function (e) {
			var selector = window.$ || window.jQuery;
			if (selector) {
				TweenLite.selector = selector;
				return selector(e);
			}
			return typeof document === "undefined" ? e : document.querySelectorAll ? document.querySelectorAll(e) : document.getElementById(e.charAt(0) === "#" ? e.substr(1) : e);
		};

		var _lazyTweens = [],
		    _lazyLookup = {},
		    _numbersExp = /(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig,

		//_nonNumbersExp = /(?:([\-+](?!(\d|=)))|[^\d\-+=e]|(e(?![\-+][\d])))+/ig,
		_setRatio = function (v) {
			var pt = this._firstPT,
			    min = 0.000001,
			    val;
			while (pt) {
				val = !pt.blob ? pt.c * v + pt.s : v ? this.join("") : this.start;
				if (pt.r) {
					val = Math.round(val);
				} else if (val < min) if (val > -min) {
					//prevents issues with converting very small numbers to strings in the browser
					val = 0;
				}
				if (!pt.f) {
					pt.t[pt.p] = val;
				} else if (pt.fp) {
					pt.t[pt.p](pt.fp, val);
				} else {
					pt.t[pt.p](val);
				}
				pt = pt._next;
			}
		},

		//compares two strings (start/end), finds the numbers that are different and spits back an array representing the whole value but with the changing values isolated as elements. For example, "rgb(0,0,0)" and "rgb(100,50,0)" would become ["rgb(", 0, ",", 50, ",0)"]. Notice it merges the parts that are identical (performance optimization). The array also has a linked list of PropTweens attached starting with _firstPT that contain the tweening data (t, p, s, c, f, etc.). It also stores the starting value as a "start" property so that we can revert to it if/when necessary, like when a tween rewinds fully. If the quantity of numbers differs between the start and end, it will always prioritize the end value(s). The pt parameter is optional - it's for a PropTween that will be appended to the end of the linked list and is typically for actually setting the value after all of the elements have been updated (with array.join("")).
		_blobDif = function (start, end, filter, pt) {
			var a = [start, end],
			    charIndex = 0,
			    s = "",
			    color = 0,
			    startNums,
			    endNums,
			    num,
			    i,
			    l,
			    nonNumbers,
			    currentNum;
			a.start = start;
			if (filter) {
				filter(a); //pass an array with the starting and ending values and let the filter do whatever it needs to the values.
				start = a[0];
				end = a[1];
			}
			a.length = 0;
			startNums = start.match(_numbersExp) || [];
			endNums = end.match(_numbersExp) || [];
			if (pt) {
				pt._next = null;
				pt.blob = 1;
				a._firstPT = pt; //apply last in the linked list (which means inserting it first)
			}
			l = endNums.length;
			for (i = 0; i < l; i++) {
				currentNum = endNums[i];
				nonNumbers = end.substr(charIndex, end.indexOf(currentNum, charIndex) - charIndex);
				s += nonNumbers || !i ? nonNumbers : ","; //note: SVG spec allows omission of comma/space when a negative sign is wedged between two numbers, like 2.5-5.3 instead of 2.5,-5.3 but when tweening, the negative value may switch to positive, so we insert the comma just in case.
				charIndex += nonNumbers.length;
				if (color) {
					//sense rgba() values and round them.
					color = (color + 1) % 5;
				} else if (nonNumbers.substr(-5) === "rgba(") {
					color = 1;
				}
				if (currentNum === startNums[i] || startNums.length <= i) {
					s += currentNum;
				} else {
					if (s) {
						a.push(s);
						s = "";
					}
					num = parseFloat(startNums[i]);
					a.push(num);
					a._firstPT = { _next: a._firstPT, t: a, p: a.length - 1, s: num, c: (currentNum.charAt(1) === "=" ? parseInt(currentNum.charAt(0) + "1", 10) * parseFloat(currentNum.substr(2)) : parseFloat(currentNum) - num) || 0, f: 0, r: color && color < 4 };
					//note: we don't set _prev because we'll never need to remove individual PropTweens from this list.
				}
				charIndex += currentNum.length;
			}
			s += end.substr(charIndex);
			if (s) {
				a.push(s);
			}
			a.setRatio = _setRatio;
			return a;
		},

		//note: "funcParam" is only necessary for function-based getters/setters that require an extra parameter like getAttribute("width") and setAttribute("width", value). In this example, funcParam would be "width". Used by AttrPlugin for example.
		_addPropTween = function (target, prop, start, end, overwriteProp, round, funcParam, stringFilter) {
			var s = start === "get" ? target[prop] : start,
			    type = typeof target[prop],
			    isRelative = typeof end === "string" && end.charAt(1) === "=",
			    pt = { t: target, p: prop, s: s, f: type === "function", pg: 0, n: overwriteProp || prop, r: round, pr: 0, c: isRelative ? parseInt(end.charAt(0) + "1", 10) * parseFloat(end.substr(2)) : parseFloat(end) - s || 0 },
			    blob,
			    getterName;
			if (type !== "number") {
				if (type === "function" && start === "get") {
					getterName = prop.indexOf("set") || typeof target["get" + prop.substr(3)] !== "function" ? prop : "get" + prop.substr(3);
					pt.s = s = funcParam ? target[getterName](funcParam) : target[getterName]();
				}
				if (typeof s === "string" && (funcParam || isNaN(s))) {
					//a blob (string that has multiple numbers in it)
					pt.fp = funcParam;
					blob = _blobDif(s, end, stringFilter || TweenLite.defaultStringFilter, pt);
					pt = { t: blob, p: "setRatio", s: 0, c: 1, f: 2, pg: 0, n: overwriteProp || prop, pr: 0 }; //"2" indicates it's a Blob property tween. Needed for RoundPropsPlugin for example.
				} else if (!isRelative) {
					pt.c = parseFloat(end) - parseFloat(s) || 0;
				}
			}
			if (pt.c) {
				//only add it to the linked list if there's a change.
				if (pt._next = this._firstPT) {
					pt._next._prev = pt;
				}
				this._firstPT = pt;
				return pt;
			}
		},
		    _internals = TweenLite._internals = { isArray: _isArray, isSelector: _isSelector, lazyTweens: _lazyTweens, blobDif: _blobDif },
		    //gives us a way to expose certain private values to other GreenSock classes without contaminating tha main TweenLite object.
		_plugins = TweenLite._plugins = {},
		    _tweenLookup = _internals.tweenLookup = {},
		    _tweenLookupNum = 0,
		    _reservedProps = _internals.reservedProps = { ease: 1, delay: 1, overwrite: 1, onComplete: 1, onCompleteParams: 1, onCompleteScope: 1, useFrames: 1, runBackwards: 1, startAt: 1, onUpdate: 1, onUpdateParams: 1, onUpdateScope: 1, onStart: 1, onStartParams: 1, onStartScope: 1, onReverseComplete: 1, onReverseCompleteParams: 1, onReverseCompleteScope: 1, onRepeat: 1, onRepeatParams: 1, onRepeatScope: 1, easeParams: 1, yoyo: 1, immediateRender: 1, repeat: 1, repeatDelay: 1, data: 1, paused: 1, reversed: 1, autoCSS: 1, lazy: 1, onOverwrite: 1, callbackScope: 1, stringFilter: 1 },
		    _overwriteLookup = { none: 0, all: 1, auto: 2, concurrent: 3, allOnStart: 4, preexisting: 5, "true": 1, "false": 0 },
		    _rootFramesTimeline = Animation._rootFramesTimeline = new SimpleTimeline(),
		    _rootTimeline = Animation._rootTimeline = new SimpleTimeline(),
		    _nextGCFrame = 30,
		    _lazyRender = _internals.lazyRender = function () {
			var i = _lazyTweens.length,
			    tween;
			_lazyLookup = {};
			while (--i > -1) {
				tween = _lazyTweens[i];
				if (tween && tween._lazy !== false) {
					tween.render(tween._lazy[0], tween._lazy[1], true);
					tween._lazy = false;
				}
			}
			_lazyTweens.length = 0;
		};

		_rootTimeline._startTime = _ticker.time;
		_rootFramesTimeline._startTime = _ticker.frame;
		_rootTimeline._active = _rootFramesTimeline._active = true;
		setTimeout(_lazyRender, 1); //on some mobile devices, there isn't a "tick" before code runs which means any lazy renders wouldn't run before the next official "tick".

		Animation._updateRoot = TweenLite.render = function () {
			var i, a, p;
			if (_lazyTweens.length) {
				//if code is run outside of the requestAnimationFrame loop, there may be tweens queued AFTER the engine refreshed, so we need to ensure any pending renders occur before we refresh again.
				_lazyRender();
			}
			_rootTimeline.render((_ticker.time - _rootTimeline._startTime) * _rootTimeline._timeScale, false, false);
			_rootFramesTimeline.render((_ticker.frame - _rootFramesTimeline._startTime) * _rootFramesTimeline._timeScale, false, false);
			if (_lazyTweens.length) {
				_lazyRender();
			}
			if (_ticker.frame >= _nextGCFrame) {
				//dump garbage every 120 frames or whatever the user sets TweenLite.autoSleep to
				_nextGCFrame = _ticker.frame + (parseInt(TweenLite.autoSleep, 10) || 120);
				for (p in _tweenLookup) {
					a = _tweenLookup[p].tweens;
					i = a.length;
					while (--i > -1) {
						if (a[i]._gc) {
							a.splice(i, 1);
						}
					}
					if (a.length === 0) {
						delete _tweenLookup[p];
					}
				}
				//if there are no more tweens in the root timelines, or if they're all paused, make the _timer sleep to reduce load on the CPU slightly
				p = _rootTimeline._first;
				if (!p || p._paused) if (TweenLite.autoSleep && !_rootFramesTimeline._first && _ticker._listeners.tick.length === 1) {
					while (p && p._paused) {
						p = p._next;
					}
					if (!p) {
						_ticker.sleep();
					}
				}
			}
		};

		_ticker.addEventListener("tick", Animation._updateRoot);

		var _register = function (target, tween, scrub) {
			var id = target._gsTweenID,
			    a,
			    i;
			if (!_tweenLookup[id || (target._gsTweenID = id = "t" + _tweenLookupNum++)]) {
				_tweenLookup[id] = { target: target, tweens: [] };
			}
			if (tween) {
				a = _tweenLookup[id].tweens;
				a[i = a.length] = tween;
				if (scrub) {
					while (--i > -1) {
						if (a[i] === tween) {
							a.splice(i, 1);
						}
					}
				}
			}
			return _tweenLookup[id].tweens;
		},
		    _onOverwrite = function (overwrittenTween, overwritingTween, target, killedProps) {
			var func = overwrittenTween.vars.onOverwrite,
			    r1,
			    r2;
			if (func) {
				r1 = func(overwrittenTween, overwritingTween, target, killedProps);
			}
			func = TweenLite.onOverwrite;
			if (func) {
				r2 = func(overwrittenTween, overwritingTween, target, killedProps);
			}
			return r1 !== false && r2 !== false;
		},
		    _applyOverwrite = function (target, tween, props, mode, siblings) {
			var i, changed, curTween, l;
			if (mode === 1 || mode >= 4) {
				l = siblings.length;
				for (i = 0; i < l; i++) {
					if ((curTween = siblings[i]) !== tween) {
						if (!curTween._gc) {
							if (curTween._kill(null, target, tween)) {
								changed = true;
							}
						}
					} else if (mode === 5) {
						break;
					}
				}
				return changed;
			}
			//NOTE: Add 0.0000000001 to overcome floating point errors that can cause the startTime to be VERY slightly off (when a tween's time() is set for example)
			var startTime = tween._startTime + _tinyNum,
			    overlaps = [],
			    oCount = 0,
			    zeroDur = tween._duration === 0,
			    globalStart;
			i = siblings.length;
			while (--i > -1) {
				if ((curTween = siblings[i]) === tween || curTween._gc || curTween._paused) {
					//ignore
				} else if (curTween._timeline !== tween._timeline) {
					globalStart = globalStart || _checkOverlap(tween, 0, zeroDur);
					if (_checkOverlap(curTween, globalStart, zeroDur) === 0) {
						overlaps[oCount++] = curTween;
					}
				} else if (curTween._startTime <= startTime) if (curTween._startTime + curTween.totalDuration() / curTween._timeScale > startTime) if (!((zeroDur || !curTween._initted) && startTime - curTween._startTime <= 0.0000000002)) {
					overlaps[oCount++] = curTween;
				}
			}

			i = oCount;
			while (--i > -1) {
				curTween = overlaps[i];
				if (mode === 2) if (curTween._kill(props, target, tween)) {
					changed = true;
				}
				if (mode !== 2 || !curTween._firstPT && curTween._initted) {
					if (mode !== 2 && !_onOverwrite(curTween, tween)) {
						continue;
					}
					if (curTween._enabled(false, false)) {
						//if all property tweens have been overwritten, kill the tween.
						changed = true;
					}
				}
			}
			return changed;
		},
		    _checkOverlap = function (tween, reference, zeroDur) {
			var tl = tween._timeline,
			    ts = tl._timeScale,
			    t = tween._startTime;
			while (tl._timeline) {
				t += tl._startTime;
				ts *= tl._timeScale;
				if (tl._paused) {
					return -100;
				}
				tl = tl._timeline;
			}
			t /= ts;
			return t > reference ? t - reference : zeroDur && t === reference || !tween._initted && t - reference < 2 * _tinyNum ? _tinyNum : (t += tween.totalDuration() / tween._timeScale / ts) > reference + _tinyNum ? 0 : t - reference - _tinyNum;
		};

		//---- TweenLite instance methods -----------------------------------------------------------------------------

		p._init = function () {
			var v = this.vars,
			    op = this._overwrittenProps,
			    dur = this._duration,
			    immediate = !!v.immediateRender,
			    ease = v.ease,
			    i,
			    initPlugins,
			    pt,
			    p,
			    startVars;
			if (v.startAt) {
				if (this._startAt) {
					this._startAt.render(-1, true); //if we've run a startAt previously (when the tween instantiated), we should revert it so that the values re-instantiate correctly particularly for relative tweens. Without this, a TweenLite.fromTo(obj, 1, {x:"+=100"}, {x:"-=100"}), for example, would actually jump to +=200 because the startAt would run twice, doubling the relative change.
					this._startAt.kill();
				}
				startVars = {};
				for (p in v.startAt) {
					//copy the properties/values into a new object to avoid collisions, like var to = {x:0}, from = {x:500}; timeline.fromTo(e, 1, from, to).fromTo(e, 1, to, from);
					startVars[p] = v.startAt[p];
				}
				startVars.overwrite = false;
				startVars.immediateRender = true;
				startVars.lazy = immediate && v.lazy !== false;
				startVars.startAt = startVars.delay = null; //no nesting of startAt objects allowed (otherwise it could cause an infinite loop).
				this._startAt = TweenLite.to(this.target, 0, startVars);
				if (immediate) {
					if (this._time > 0) {
						this._startAt = null; //tweens that render immediately (like most from() and fromTo() tweens) shouldn't revert when their parent timeline's playhead goes backward past the startTime because the initial render could have happened anytime and it shouldn't be directly correlated to this tween's startTime. Imagine setting up a complex animation where the beginning states of various objects are rendered immediately but the tween doesn't happen for quite some time - if we revert to the starting values as soon as the playhead goes backward past the tween's startTime, it will throw things off visually. Reversion should only happen in TimelineLite/Max instances where immediateRender was false (which is the default in the convenience methods like from()).
					} else if (dur !== 0) {
						return; //we skip initialization here so that overwriting doesn't occur until the tween actually begins. Otherwise, if you create several immediateRender:true tweens of the same target/properties to drop into a TimelineLite or TimelineMax, the last one created would overwrite the first ones because they didn't get placed into the timeline yet before the first render occurs and kicks in overwriting.
					}
				}
			} else if (v.runBackwards && dur !== 0) {
				//from() tweens must be handled uniquely: their beginning values must be rendered but we don't want overwriting to occur yet (when time is still 0). Wait until the tween actually begins before doing all the routines like overwriting. At that time, we should render at the END of the tween to ensure that things initialize correctly (remember, from() tweens go backwards)
				if (this._startAt) {
					this._startAt.render(-1, true);
					this._startAt.kill();
					this._startAt = null;
				} else {
					if (this._time !== 0) {
						//in rare cases (like if a from() tween runs and then is invalidate()-ed), immediateRender could be true but the initial forced-render gets skipped, so there's no need to force the render in this context when the _time is greater than 0
						immediate = false;
					}
					pt = {};
					for (p in v) {
						//copy props into a new object and skip any reserved props, otherwise onComplete or onUpdate or onStart could fire. We should, however, permit autoCSS to go through.
						if (!_reservedProps[p] || p === "autoCSS") {
							pt[p] = v[p];
						}
					}
					pt.overwrite = 0;
					pt.data = "isFromStart"; //we tag the tween with as "isFromStart" so that if [inside a plugin] we need to only do something at the very END of a tween, we have a way of identifying this tween as merely the one that's setting the beginning values for a "from()" tween. For example, clearProps in CSSPlugin should only get applied at the very END of a tween and without this tag, from(...{height:100, clearProps:"height", delay:1}) would wipe the height at the beginning of the tween and after 1 second, it'd kick back in.
					pt.lazy = immediate && v.lazy !== false;
					pt.immediateRender = immediate; //zero-duration tweens render immediately by default, but if we're not specifically instructed to render this tween immediately, we should skip this and merely _init() to record the starting values (rendering them immediately would push them to completion which is wasteful in that case - we'd have to render(-1) immediately after)
					this._startAt = TweenLite.to(this.target, 0, pt);
					if (!immediate) {
						this._startAt._init(); //ensures that the initial values are recorded
						this._startAt._enabled(false); //no need to have the tween render on the next cycle. Disable it because we'll always manually control the renders of the _startAt tween.
						if (this.vars.immediateRender) {
							this._startAt = null;
						}
					} else if (this._time === 0) {
						return;
					}
				}
			}
			this._ease = ease = !ease ? TweenLite.defaultEase : ease instanceof Ease ? ease : typeof ease === "function" ? new Ease(ease, v.easeParams) : _easeMap[ease] || TweenLite.defaultEase;
			if (v.easeParams instanceof Array && ease.config) {
				this._ease = ease.config.apply(ease, v.easeParams);
			}
			this._easeType = this._ease._type;
			this._easePower = this._ease._power;
			this._firstPT = null;

			if (this._targets) {
				i = this._targets.length;
				while (--i > -1) {
					if (this._initProps(this._targets[i], this._propLookup[i] = {}, this._siblings[i], op ? op[i] : null)) {
						initPlugins = true;
					}
				}
			} else {
				initPlugins = this._initProps(this.target, this._propLookup, this._siblings, op);
			}

			if (initPlugins) {
				TweenLite._onPluginEvent("_onInitAllProps", this); //reorders the array in order of priority. Uses a static TweenPlugin method in order to minimize file size in TweenLite
			}
			if (op) if (!this._firstPT) if (typeof this.target !== "function") {
				//if all tweening properties have been overwritten, kill the tween. If the target is a function, it's probably a delayedCall so let it live.
				this._enabled(false, false);
			}
			if (v.runBackwards) {
				pt = this._firstPT;
				while (pt) {
					pt.s += pt.c;
					pt.c = -pt.c;
					pt = pt._next;
				}
			}
			this._onUpdate = v.onUpdate;
			this._initted = true;
		};

		p._initProps = function (target, propLookup, siblings, overwrittenProps) {
			var p, i, initPlugins, plugin, pt, v;
			if (target == null) {
				return false;
			}

			if (_lazyLookup[target._gsTweenID]) {
				_lazyRender(); //if other tweens of the same target have recently initted but haven't rendered yet, we've got to force the render so that the starting values are correct (imagine populating a timeline with a bunch of sequential tweens and then jumping to the end)
			}

			if (!this.vars.css) if (target.style) if (target !== window && target.nodeType) if (_plugins.css) if (this.vars.autoCSS !== false) {
				//it's so common to use TweenLite/Max to animate the css of DOM elements, we assume that if the target is a DOM element, that's what is intended (a convenience so that users don't have to wrap things in css:{}, although we still recommend it for a slight performance boost and better specificity). Note: we cannot check "nodeType" on the window inside an iframe.
				_autoCSS(this.vars, target);
			}
			for (p in this.vars) {
				v = this.vars[p];
				if (_reservedProps[p]) {
					if (v) if (v instanceof Array || v.push && _isArray(v)) if (v.join("").indexOf("{self}") !== -1) {
						this.vars[p] = v = this._swapSelfInParams(v, this);
					}
				} else if (_plugins[p] && (plugin = new _plugins[p]())._onInitTween(target, this.vars[p], this)) {

					//t - target 		[object]
					//p - property 		[string]
					//s - start			[number]
					//c - change		[number]
					//f - isFunction	[boolean]
					//n - name			[string]
					//pg - isPlugin 	[boolean]
					//pr - priority		[number]
					this._firstPT = pt = { _next: this._firstPT, t: plugin, p: "setRatio", s: 0, c: 1, f: 1, n: p, pg: 1, pr: plugin._priority };
					i = plugin._overwriteProps.length;
					while (--i > -1) {
						propLookup[plugin._overwriteProps[i]] = this._firstPT;
					}
					if (plugin._priority || plugin._onInitAllProps) {
						initPlugins = true;
					}
					if (plugin._onDisable || plugin._onEnable) {
						this._notifyPluginsOfEnabled = true;
					}
					if (pt._next) {
						pt._next._prev = pt;
					}
				} else {
					propLookup[p] = _addPropTween.call(this, target, p, "get", v, p, 0, null, this.vars.stringFilter);
				}
			}

			if (overwrittenProps) if (this._kill(overwrittenProps, target)) {
				//another tween may have tried to overwrite properties of this tween before init() was called (like if two tweens start at the same time, the one created second will run first)
				return this._initProps(target, propLookup, siblings, overwrittenProps);
			}
			if (this._overwrite > 1) if (this._firstPT) if (siblings.length > 1) if (_applyOverwrite(target, this, propLookup, this._overwrite, siblings)) {
				this._kill(propLookup, target);
				return this._initProps(target, propLookup, siblings, overwrittenProps);
			}
			if (this._firstPT) if (this.vars.lazy !== false && this._duration || this.vars.lazy && !this._duration) {
				//zero duration tweens don't lazy render by default; everything else does.
				_lazyLookup[target._gsTweenID] = true;
			}
			return initPlugins;
		};

		p.render = function (time, suppressEvents, force) {
			var prevTime = this._time,
			    duration = this._duration,
			    prevRawPrevTime = this._rawPrevTime,
			    isComplete,
			    callback,
			    pt,
			    rawPrevTime;
			if (time >= duration) {
				this._totalTime = this._time = duration;
				this.ratio = this._ease._calcEnd ? this._ease.getRatio(1) : 1;
				if (!this._reversed) {
					isComplete = true;
					callback = "onComplete";
					force = force || this._timeline.autoRemoveChildren; //otherwise, if the animation is unpaused/activated after it's already finished, it doesn't get removed from the parent timeline.
				}
				if (duration === 0) if (this._initted || !this.vars.lazy || force) {
					//zero-duration tweens are tricky because we must discern the momentum/direction of time in order to determine whether the starting values should be rendered or the ending values. If the "playhead" of its timeline goes past the zero-duration tween in the forward direction or lands directly on it, the end values should be rendered, but if the timeline's "playhead" moves past it in the backward direction (from a postitive time to a negative time), the starting values must be rendered.
					if (this._startTime === this._timeline._duration) {
						//if a zero-duration tween is at the VERY end of a timeline and that timeline renders at its end, it will typically add a tiny bit of cushion to the render time to prevent rounding errors from getting in the way of tweens rendering their VERY end. If we then reverse() that timeline, the zero-duration tween will trigger its onReverseComplete even though technically the playhead didn't pass over it again. It's a very specific edge case we must accommodate.
						time = 0;
					}
					if (time === 0 || prevRawPrevTime < 0 || prevRawPrevTime === _tinyNum && this.data !== "isPause") if (prevRawPrevTime !== time) {
						//note: when this.data is "isPause", it's a callback added by addPause() on a timeline that we should not be triggered when LEAVING its exact start time. In other words, tl.addPause(1).play(1) shouldn't pause.
						force = true;
						if (prevRawPrevTime > _tinyNum) {
							callback = "onReverseComplete";
						}
					}
					this._rawPrevTime = rawPrevTime = !suppressEvents || time || prevRawPrevTime === time ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
				}
			} else if (time < 0.0000001) {
				//to work around occasional floating point math artifacts, round super small values to 0.
				this._totalTime = this._time = 0;
				this.ratio = this._ease._calcEnd ? this._ease.getRatio(0) : 0;
				if (prevTime !== 0 || duration === 0 && prevRawPrevTime > 0) {
					callback = "onReverseComplete";
					isComplete = this._reversed;
				}
				if (time < 0) {
					this._active = false;
					if (duration === 0) if (this._initted || !this.vars.lazy || force) {
						//zero-duration tweens are tricky because we must discern the momentum/direction of time in order to determine whether the starting values should be rendered or the ending values. If the "playhead" of its timeline goes past the zero-duration tween in the forward direction or lands directly on it, the end values should be rendered, but if the timeline's "playhead" moves past it in the backward direction (from a postitive time to a negative time), the starting values must be rendered.
						if (prevRawPrevTime >= 0 && !(prevRawPrevTime === _tinyNum && this.data === "isPause")) {
							force = true;
						}
						this._rawPrevTime = rawPrevTime = !suppressEvents || time || prevRawPrevTime === time ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
					}
				}
				if (!this._initted) {
					//if we render the very beginning (time == 0) of a fromTo(), we must force the render (normal tweens wouldn't need to render at a time of 0 when the prevTime was also 0). This is also mandatory to make sure overwriting kicks in immediately.
					force = true;
				}
			} else {
				this._totalTime = this._time = time;

				if (this._easeType) {
					var r = time / duration,
					    type = this._easeType,
					    pow = this._easePower;
					if (type === 1 || type === 3 && r >= 0.5) {
						r = 1 - r;
					}
					if (type === 3) {
						r *= 2;
					}
					if (pow === 1) {
						r *= r;
					} else if (pow === 2) {
						r *= r * r;
					} else if (pow === 3) {
						r *= r * r * r;
					} else if (pow === 4) {
						r *= r * r * r * r;
					}

					if (type === 1) {
						this.ratio = 1 - r;
					} else if (type === 2) {
						this.ratio = r;
					} else if (time / duration < 0.5) {
						this.ratio = r / 2;
					} else {
						this.ratio = 1 - r / 2;
					}
				} else {
					this.ratio = this._ease.getRatio(time / duration);
				}
			}

			if (this._time === prevTime && !force) {
				return;
			} else if (!this._initted) {
				this._init();
				if (!this._initted || this._gc) {
					//immediateRender tweens typically won't initialize until the playhead advances (_time is greater than 0) in order to ensure that overwriting occurs properly. Also, if all of the tweening properties have been overwritten (which would cause _gc to be true, as set in _init()), we shouldn't continue otherwise an onStart callback could be called for example.
					return;
				} else if (!force && this._firstPT && (this.vars.lazy !== false && this._duration || this.vars.lazy && !this._duration)) {
					this._time = this._totalTime = prevTime;
					this._rawPrevTime = prevRawPrevTime;
					_lazyTweens.push(this);
					this._lazy = [time, suppressEvents];
					return;
				}
				//_ease is initially set to defaultEase, so now that init() has run, _ease is set properly and we need to recalculate the ratio. Overall this is faster than using conditional logic earlier in the method to avoid having to set ratio twice because we only init() once but renderTime() gets called VERY frequently.
				if (this._time && !isComplete) {
					this.ratio = this._ease.getRatio(this._time / duration);
				} else if (isComplete && this._ease._calcEnd) {
					this.ratio = this._ease.getRatio(this._time === 0 ? 0 : 1);
				}
			}
			if (this._lazy !== false) {
				//in case a lazy render is pending, we should flush it because the new render is occurring now (imagine a lazy tween instantiating and then immediately the user calls tween.seek(tween.duration()), skipping to the end - the end render would be forced, and then if we didn't flush the lazy render, it'd fire AFTER the seek(), rendering it at the wrong time.
				this._lazy = false;
			}
			if (!this._active) if (!this._paused && this._time !== prevTime && time >= 0) {
				this._active = true; //so that if the user renders a tween (as opposed to the timeline rendering it), the timeline is forced to re-render and align it with the proper time/frame on the next rendering cycle. Maybe the tween already finished but the user manually re-renders it as halfway done.
			}
			if (prevTime === 0) {
				if (this._startAt) {
					if (time >= 0) {
						this._startAt.render(time, suppressEvents, force);
					} else if (!callback) {
						callback = "_dummyGS"; //if no callback is defined, use a dummy value just so that the condition at the end evaluates as true because _startAt should render AFTER the normal render loop when the time is negative. We could handle this in a more intuitive way, of course, but the render loop is the MOST important thing to optimize, so this technique allows us to avoid adding extra conditional logic in a high-frequency area.
					}
				}
				if (this.vars.onStart) if (this._time !== 0 || duration === 0) if (!suppressEvents) {
					this._callback("onStart");
				}
			}
			pt = this._firstPT;
			while (pt) {
				if (pt.f) {
					pt.t[pt.p](pt.c * this.ratio + pt.s);
				} else {
					pt.t[pt.p] = pt.c * this.ratio + pt.s;
				}
				pt = pt._next;
			}

			if (this._onUpdate) {
				if (time < 0) if (this._startAt && time !== -0.0001) {
					//if the tween is positioned at the VERY beginning (_startTime 0) of its parent timeline, it's illegal for the playhead to go back further, so we should not render the recorded startAt values.
					this._startAt.render(time, suppressEvents, force); //note: for performance reasons, we tuck this conditional logic inside less traveled areas (most tweens don't have an onUpdate). We'd just have it at the end before the onComplete, but the values should be updated before any onUpdate is called, so we ALSO put it here and then if it's not called, we do so later near the onComplete.
				}
				if (!suppressEvents) if (this._time !== prevTime || isComplete) {
					this._callback("onUpdate");
				}
			}
			if (callback) if (!this._gc || force) {
				//check _gc because there's a chance that kill() could be called in an onUpdate
				if (time < 0 && this._startAt && !this._onUpdate && time !== -0.0001) {
					//-0.0001 is a special value that we use when looping back to the beginning of a repeated TimelineMax, in which case we shouldn't render the _startAt values.
					this._startAt.render(time, suppressEvents, force);
				}
				if (isComplete) {
					if (this._timeline.autoRemoveChildren) {
						this._enabled(false, false);
					}
					this._active = false;
				}
				if (!suppressEvents && this.vars[callback]) {
					this._callback(callback);
				}
				if (duration === 0 && this._rawPrevTime === _tinyNum && rawPrevTime !== _tinyNum) {
					//the onComplete or onReverseComplete could trigger movement of the playhead and for zero-duration tweens (which must discern direction) that land directly back on their start time, we don't want to fire again on the next render. Think of several addPause()'s in a timeline that forces the playhead to a certain spot, but what if it's already paused and another tween is tweening the "time" of the timeline? Each time it moves [forward] past that spot, it would move back, and since suppressEvents is true, it'd reset _rawPrevTime to _tinyNum so that when it begins again, the callback would fire (so ultimately it could bounce back and forth during that tween). Again, this is a very uncommon scenario, but possible nonetheless.
					this._rawPrevTime = 0;
				}
			}
		};

		p._kill = function (vars, target, overwritingTween) {
			if (vars === "all") {
				vars = null;
			}
			if (vars == null) if (target == null || target === this.target) {
				this._lazy = false;
				return this._enabled(false, false);
			}
			target = typeof target !== "string" ? target || this._targets || this.target : TweenLite.selector(target) || target;
			var simultaneousOverwrite = overwritingTween && this._time && overwritingTween._startTime === this._startTime && this._timeline === overwritingTween._timeline,
			    i,
			    overwrittenProps,
			    p,
			    pt,
			    propLookup,
			    changed,
			    killProps,
			    record,
			    killed;
			if ((_isArray(target) || _isSelector(target)) && typeof target[0] !== "number") {
				i = target.length;
				while (--i > -1) {
					if (this._kill(vars, target[i], overwritingTween)) {
						changed = true;
					}
				}
			} else {
				if (this._targets) {
					i = this._targets.length;
					while (--i > -1) {
						if (target === this._targets[i]) {
							propLookup = this._propLookup[i] || {};
							this._overwrittenProps = this._overwrittenProps || [];
							overwrittenProps = this._overwrittenProps[i] = vars ? this._overwrittenProps[i] || {} : "all";
							break;
						}
					}
				} else if (target !== this.target) {
					return false;
				} else {
					propLookup = this._propLookup;
					overwrittenProps = this._overwrittenProps = vars ? this._overwrittenProps || {} : "all";
				}

				if (propLookup) {
					killProps = vars || propLookup;
					record = vars !== overwrittenProps && overwrittenProps !== "all" && vars !== propLookup && (typeof vars !== "object" || !vars._tempKill); //_tempKill is a super-secret way to delete a particular tweening property but NOT have it remembered as an official overwritten property (like in BezierPlugin)
					if (overwritingTween && (TweenLite.onOverwrite || this.vars.onOverwrite)) {
						for (p in killProps) {
							if (propLookup[p]) {
								if (!killed) {
									killed = [];
								}
								killed.push(p);
							}
						}
						if ((killed || !vars) && !_onOverwrite(this, overwritingTween, target, killed)) {
							//if the onOverwrite returned false, that means the user wants to override the overwriting (cancel it).
							return false;
						}
					}

					for (p in killProps) {
						if (pt = propLookup[p]) {
							if (simultaneousOverwrite) {
								//if another tween overwrites this one and they both start at exactly the same time, yet this tween has already rendered once (for example, at 0.001) because it's first in the queue, we should revert the values to where they were at 0 so that the starting values aren't contaminated on the overwriting tween.
								if (pt.f) {
									pt.t[pt.p](pt.s);
								} else {
									pt.t[pt.p] = pt.s;
								}
								changed = true;
							}
							if (pt.pg && pt.t._kill(killProps)) {
								changed = true; //some plugins need to be notified so they can perform cleanup tasks first
							}
							if (!pt.pg || pt.t._overwriteProps.length === 0) {
								if (pt._prev) {
									pt._prev._next = pt._next;
								} else if (pt === this._firstPT) {
									this._firstPT = pt._next;
								}
								if (pt._next) {
									pt._next._prev = pt._prev;
								}
								pt._next = pt._prev = null;
							}
							delete propLookup[p];
						}
						if (record) {
							overwrittenProps[p] = 1;
						}
					}
					if (!this._firstPT && this._initted) {
						//if all tweening properties are killed, kill the tween. Without this line, if there's a tween with multiple targets and then you killTweensOf() each target individually, the tween would technically still remain active and fire its onComplete even though there aren't any more properties tweening.
						this._enabled(false, false);
					}
				}
			}
			return changed;
		};

		p.invalidate = function () {
			if (this._notifyPluginsOfEnabled) {
				TweenLite._onPluginEvent("_onDisable", this);
			}
			this._firstPT = this._overwrittenProps = this._startAt = this._onUpdate = null;
			this._notifyPluginsOfEnabled = this._active = this._lazy = false;
			this._propLookup = this._targets ? {} : [];
			Animation.prototype.invalidate.call(this);
			if (this.vars.immediateRender) {
				this._time = -_tinyNum; //forces a render without having to set the render() "force" parameter to true because we want to allow lazying by default (using the "force" parameter always forces an immediate full render)
				this.render(-this._delay);
			}
			return this;
		};

		p._enabled = function (enabled, ignoreTimeline) {
			if (!_tickerActive) {
				_ticker.wake();
			}
			if (enabled && this._gc) {
				var targets = this._targets,
				    i;
				if (targets) {
					i = targets.length;
					while (--i > -1) {
						this._siblings[i] = _register(targets[i], this, true);
					}
				} else {
					this._siblings = _register(this.target, this, true);
				}
			}
			Animation.prototype._enabled.call(this, enabled, ignoreTimeline);
			if (this._notifyPluginsOfEnabled) if (this._firstPT) {
				return TweenLite._onPluginEvent(enabled ? "_onEnable" : "_onDisable", this);
			}
			return false;
		};

		//----TweenLite static methods -----------------------------------------------------

		TweenLite.to = function (target, duration, vars) {
			return new TweenLite(target, duration, vars);
		};

		TweenLite.from = function (target, duration, vars) {
			vars.runBackwards = true;
			vars.immediateRender = vars.immediateRender != false;
			return new TweenLite(target, duration, vars);
		};

		TweenLite.fromTo = function (target, duration, fromVars, toVars) {
			toVars.startAt = fromVars;
			toVars.immediateRender = toVars.immediateRender != false && fromVars.immediateRender != false;
			return new TweenLite(target, duration, toVars);
		};

		TweenLite.delayedCall = function (delay, callback, params, scope, useFrames) {
			return new TweenLite(callback, 0, { delay: delay, onComplete: callback, onCompleteParams: params, callbackScope: scope, onReverseComplete: callback, onReverseCompleteParams: params, immediateRender: false, lazy: false, useFrames: useFrames, overwrite: 0 });
		};

		TweenLite.set = function (target, vars) {
			return new TweenLite(target, 0, vars);
		};

		TweenLite.getTweensOf = function (target, onlyActive) {
			if (target == null) {
				return [];
			}
			target = typeof target !== "string" ? target : TweenLite.selector(target) || target;
			var i, a, j, t;
			if ((_isArray(target) || _isSelector(target)) && typeof target[0] !== "number") {
				i = target.length;
				a = [];
				while (--i > -1) {
					a = a.concat(TweenLite.getTweensOf(target[i], onlyActive));
				}
				i = a.length;
				//now get rid of any duplicates (tweens of arrays of objects could cause duplicates)
				while (--i > -1) {
					t = a[i];
					j = i;
					while (--j > -1) {
						if (t === a[j]) {
							a.splice(i, 1);
						}
					}
				}
			} else {
				a = _register(target).concat();
				i = a.length;
				while (--i > -1) {
					if (a[i]._gc || onlyActive && !a[i].isActive()) {
						a.splice(i, 1);
					}
				}
			}
			return a;
		};

		TweenLite.killTweensOf = TweenLite.killDelayedCallsTo = function (target, onlyActive, vars) {
			if (typeof onlyActive === "object") {
				vars = onlyActive; //for backwards compatibility (before "onlyActive" parameter was inserted)
				onlyActive = false;
			}
			var a = TweenLite.getTweensOf(target, onlyActive),
			    i = a.length;
			while (--i > -1) {
				a[i]._kill(vars, target);
			}
		};

		/*
   * ----------------------------------------------------------------
   * TweenPlugin   (could easily be split out as a separate file/class, but included for ease of use (so that people don't need to include another script call before loading plugins which is easy to forget)
   * ----------------------------------------------------------------
   */
		var TweenPlugin = _class("plugins.TweenPlugin", function (props, priority) {
			this._overwriteProps = (props || "").split(",");
			this._propName = this._overwriteProps[0];
			this._priority = priority || 0;
			this._super = TweenPlugin.prototype;
		}, true);

		p = TweenPlugin.prototype;
		TweenPlugin.version = "1.18.0";
		TweenPlugin.API = 2;
		p._firstPT = null;
		p._addTween = _addPropTween;
		p.setRatio = _setRatio;

		p._kill = function (lookup) {
			var a = this._overwriteProps,
			    pt = this._firstPT,
			    i;
			if (lookup[this._propName] != null) {
				this._overwriteProps = [];
			} else {
				i = a.length;
				while (--i > -1) {
					if (lookup[a[i]] != null) {
						a.splice(i, 1);
					}
				}
			}
			while (pt) {
				if (lookup[pt.n] != null) {
					if (pt._next) {
						pt._next._prev = pt._prev;
					}
					if (pt._prev) {
						pt._prev._next = pt._next;
						pt._prev = null;
					} else if (this._firstPT === pt) {
						this._firstPT = pt._next;
					}
				}
				pt = pt._next;
			}
			return false;
		};

		p._roundProps = function (lookup, value) {
			var pt = this._firstPT;
			while (pt) {
				if (lookup[this._propName] || pt.n != null && lookup[pt.n.split(this._propName + "_").join("")]) {
					//some properties that are very plugin-specific add a prefix named after the _propName plus an underscore, so we need to ignore that extra stuff here.
					pt.r = value;
				}
				pt = pt._next;
			}
		};

		TweenLite._onPluginEvent = function (type, tween) {
			var pt = tween._firstPT,
			    changed,
			    pt2,
			    first,
			    last,
			    next;
			if (type === "_onInitAllProps") {
				//sorts the PropTween linked list in order of priority because some plugins need to render earlier/later than others, like MotionBlurPlugin applies its effects after all x/y/alpha tweens have rendered on each frame.
				while (pt) {
					next = pt._next;
					pt2 = first;
					while (pt2 && pt2.pr > pt.pr) {
						pt2 = pt2._next;
					}
					if (pt._prev = pt2 ? pt2._prev : last) {
						pt._prev._next = pt;
					} else {
						first = pt;
					}
					if (pt._next = pt2) {
						pt2._prev = pt;
					} else {
						last = pt;
					}
					pt = next;
				}
				pt = tween._firstPT = first;
			}
			while (pt) {
				if (pt.pg) if (typeof pt.t[type] === "function") if (pt.t[type]()) {
					changed = true;
				}
				pt = pt._next;
			}
			return changed;
		};

		TweenPlugin.activate = function (plugins) {
			var i = plugins.length;
			while (--i > -1) {
				if (plugins[i].API === TweenPlugin.API) {
					_plugins[new plugins[i]()._propName] = plugins[i];
				}
			}
			return true;
		};

		//provides a more concise way to define plugins that have no dependencies besides TweenPlugin and TweenLite, wrapping common boilerplate stuff into one function (added in 1.9.0). You don't NEED to use this to define a plugin - the old way still works and can be useful in certain (rare) situations.
		_gsDefine.plugin = function (config) {
			if (!config || !config.propName || !config.init || !config.API) {
				throw "illegal plugin definition.";
			}
			var propName = config.propName,
			    priority = config.priority || 0,
			    overwriteProps = config.overwriteProps,
			    map = { init: "_onInitTween", set: "setRatio", kill: "_kill", round: "_roundProps", initAll: "_onInitAllProps" },
			    Plugin = _class("plugins." + propName.charAt(0).toUpperCase() + propName.substr(1) + "Plugin", function () {
				TweenPlugin.call(this, propName, priority);
				this._overwriteProps = overwriteProps || [];
			}, config.global === true),
			    p = Plugin.prototype = new TweenPlugin(propName),
			    prop;
			p.constructor = Plugin;
			Plugin.API = config.API;
			for (prop in map) {
				if (typeof config[prop] === "function") {
					p[map[prop]] = config[prop];
				}
			}
			Plugin.version = config.version;
			TweenPlugin.activate([Plugin]);
			return Plugin;
		};

		//now run through all the dependencies discovered and if any are missing, log that to the console as a warning. This is why it's best to have TweenLite load last - it can check all the dependencies for you.
		a = window._gsQueue;
		if (a) {
			for (i = 0; i < a.length; i++) {
				a[i]();
			}
			for (p in _defLookup) {
				if (!_defLookup[p].func) {
					window.console.log("GSAP encountered missing dependency: com.greensock." + p);
				}
			}
		}

		_tickerActive = false; //ensures that the first official animation forces a ticker.tick() to update the time when it is instantiated
	})(typeof module !== "undefined" && module.exports && typeof global !== "undefined" ? global : exports || window, "TweenMax");
});
System.register("npm:systemjs-plugin-babel@0.0.21/babel-helpers/classCallCheck.js", [], function (_export, _context) {
  "use strict";

  return {
    setters: [],
    execute: function () {
      _export("default", function (instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      });
    }
  };
});
System.register("npm:systemjs-plugin-babel@0.0.21/babel-helpers/createClass.js", [], function (_export, _context) {
  "use strict";

  return {
    setters: [],
    execute: function () {
      _export("default", function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }());
    }
  };
});
System.registerDynamic("github:paperjs/paper.js@0.10.3.json", [], true, function() {
  return {
    "main": "dist/paper-full.js",
    "format": "amd"
  };
});

/*!
 * Paper.js v0.10.3 - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2016, Juerg Lehni & Jonathan Puckey
 * http://scratchdisk.com/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 *
 * Date: Wed Mar 8 10:43:28 2017 +0100
 *
 ***
 *
 * Straps.js - Class inheritance library with support for bean-style accessors
 *
 * Copyright (c) 2006 - 2016 Juerg Lehni
 * http://scratchdisk.com/
 *
 * Distributed under the MIT license.
 *
 ***
 *
 * Acorn.js
 * http://marijnhaverbeke.nl/acorn/
 *
 * Acorn is a tiny, fast JavaScript parser written in JavaScript,
 * created by Marijn Haverbeke and released under an MIT license.
 *
 */

var paper = function (self, undefined) {

	self = self || require('./node/window.js');

	var window = self.window,
	    document = self.document;

	var Base = new function () {
		var hidden = /^(statics|enumerable|beans|preserve)$/,
		    array = [],
		    slice = array.slice,
		    create = Object.create,
		    describe = Object.getOwnPropertyDescriptor,
		    define = Object.defineProperty,
		    forEach = array.forEach || function (iter, bind) {
			for (var i = 0, l = this.length; i < l; i++) {
				iter.call(bind, this[i], i, this);
			}
		},
		    forIn = function (iter, bind) {
			for (var i in this) {
				if (this.hasOwnProperty(i)) iter.call(bind, this[i], i, this);
			}
		},
		    set = Object.assign || function (dst) {
			for (var i = 1, l = arguments.length; i < l; i++) {
				var src = arguments[i];
				for (var key in src) {
					if (src.hasOwnProperty(key)) dst[key] = src[key];
				}
			}
			return dst;
		},
		    each = function (obj, iter, bind) {
			if (obj) {
				var desc = describe(obj, 'length');
				(desc && typeof desc.value === 'number' ? forEach : forIn).call(obj, iter, bind = bind || obj);
			}
			return bind;
		};

		function inject(dest, src, enumerable, beans, preserve) {
			var beansNames = {};

			function field(name, val) {
				val = val || (val = describe(src, name)) && (val.get ? val : val.value);
				if (typeof val === 'string' && val[0] === '#') val = dest[val.substring(1)] || val;
				var isFunc = typeof val === 'function',
				    res = val,
				    prev = preserve || isFunc && !val.base ? val && val.get ? name in dest : dest[name] : null,
				    bean;
				if (!preserve || !prev) {
					if (isFunc && prev) val.base = prev;
					if (isFunc && beans !== false && (bean = name.match(/^([gs]et|is)(([A-Z])(.*))$/))) beansNames[bean[3].toLowerCase() + bean[4]] = bean[2];
					if (!res || isFunc || !res.get || typeof res.get !== 'function' || !Base.isPlainObject(res)) res = { value: res, writable: true };
					if ((describe(dest, name) || { configurable: true }).configurable) {
						res.configurable = true;
						res.enumerable = enumerable;
					}
					define(dest, name, res);
				}
			}
			if (src) {
				for (var name in src) {
					if (src.hasOwnProperty(name) && !hidden.test(name)) field(name);
				}
				for (var name in beansNames) {
					var part = beansNames[name],
					    set = dest['set' + part],
					    get = dest['get' + part] || set && dest['is' + part];
					if (get && (beans === true || get.length === 0)) field(name, { get: get, set: set });
				}
			}
			return dest;
		}

		function Base() {
			for (var i = 0, l = arguments.length; i < l; i++) {
				var src = arguments[i];
				if (src) set(this, src);
			}
			return this;
		}

		return inject(Base, {
			inject: function (src) {
				if (src) {
					var statics = src.statics === true ? src : src.statics,
					    beans = src.beans,
					    preserve = src.preserve;
					if (statics !== src) inject(this.prototype, src, src.enumerable, beans, preserve);
					inject(this, statics, true, beans, preserve);
				}
				for (var i = 1, l = arguments.length; i < l; i++) this.inject(arguments[i]);
				return this;
			},

			extend: function () {
				var base = this,
				    ctor,
				    proto;
				for (var i = 0, obj, l = arguments.length; i < l && !(ctor && proto); i++) {
					obj = arguments[i];
					ctor = ctor || obj.initialize;
					proto = proto || obj.prototype;
				}
				ctor = ctor || function () {
					base.apply(this, arguments);
				};
				proto = ctor.prototype = proto || create(this.prototype);
				define(proto, 'constructor', { value: ctor, writable: true, configurable: true });
				inject(ctor, this, true);
				if (arguments.length) this.inject.apply(ctor, arguments);
				ctor.base = base;
				return ctor;
			}
		}, true).inject({
			initialize: Base,

			set: Base,

			inject: function () {
				for (var i = 0, l = arguments.length; i < l; i++) {
					var src = arguments[i];
					if (src) {
						inject(this, src, src.enumerable, src.beans, src.preserve);
					}
				}
				return this;
			},

			extend: function () {
				var res = create(this);
				return res.inject.apply(res, arguments);
			},

			each: function (iter, bind) {
				return each(this, iter, bind);
			},

			clone: function () {
				return new this.constructor(this);
			},

			statics: {
				set: set,
				each: each,
				create: create,
				define: define,
				describe: describe,

				clone: function (obj) {
					return set(new obj.constructor(), obj);
				},

				isPlainObject: function (obj) {
					var ctor = obj != null && obj.constructor;
					return ctor && (ctor === Object || ctor === Base || ctor.name === 'Object');
				},

				pick: function (a, b) {
					return a !== undefined ? a : b;
				},

				slice: function (list, begin, end) {
					return slice.call(list, begin, end);
				}
			}
		});
	}();

	if (typeof module !== 'undefined') module.exports = Base;

	Base.inject({
		toString: function () {
			return this._id != null ? (this._class || 'Object') + (this._name ? " '" + this._name + "'" : ' @' + this._id) : '{ ' + Base.each(this, function (value, key) {
				if (!/^_/.test(key)) {
					var type = typeof value;
					this.push(key + ': ' + (type === 'number' ? Formatter.instance.number(value) : type === 'string' ? "'" + value + "'" : value));
				}
			}, []).join(', ') + ' }';
		},

		getClassName: function () {
			return this._class || '';
		},

		importJSON: function (json) {
			return Base.importJSON(json, this);
		},

		exportJSON: function (options) {
			return Base.exportJSON(this, options);
		},

		toJSON: function () {
			return Base.serialize(this);
		},

		set: function (props, exclude) {
			if (props) Base.filter(this, props, exclude, this._prioritize);
			return this;
		},

		statics: {

			exports: {
				enumerable: true
			},

			extend: function extend() {
				var res = extend.base.apply(this, arguments),
				    name = res.prototype._class;
				if (name && !Base.exports[name]) Base.exports[name] = res;
				return res;
			},

			equals: function (obj1, obj2) {
				if (obj1 === obj2) return true;
				if (obj1 && obj1.equals) return obj1.equals(obj2);
				if (obj2 && obj2.equals) return obj2.equals(obj1);
				if (obj1 && obj2 && typeof obj1 === 'object' && typeof obj2 === 'object') {
					if (Array.isArray(obj1) && Array.isArray(obj2)) {
						var length = obj1.length;
						if (length !== obj2.length) return false;
						while (length--) {
							if (!Base.equals(obj1[length], obj2[length])) return false;
						}
					} else {
						var keys = Object.keys(obj1),
						    length = keys.length;
						if (length !== Object.keys(obj2).length) return false;
						while (length--) {
							var key = keys[length];
							if (!(obj2.hasOwnProperty(key) && Base.equals(obj1[key], obj2[key]))) return false;
						}
					}
					return true;
				}
				return false;
			},

			read: function (list, start, options, amount) {
				if (this === Base) {
					var value = this.peek(list, start);
					list.__index++;
					return value;
				}
				var proto = this.prototype,
				    readIndex = proto._readIndex,
				    begin = start || readIndex && list.__index || 0,
				    length = list.length,
				    obj = list[begin];
				amount = amount || length - begin;
				if (obj instanceof this || options && options.readNull && obj == null && amount <= 1) {
					if (readIndex) list.__index = begin + 1;
					return obj && options && options.clone ? obj.clone() : obj;
				}
				obj = Base.create(proto);
				if (readIndex) obj.__read = true;
				obj = obj.initialize.apply(obj, begin > 0 || begin + amount < length ? Base.slice(list, begin, begin + amount) : list) || obj;
				if (readIndex) {
					list.__index = begin + obj.__read;
					obj.__read = undefined;
				}
				return obj;
			},

			peek: function (list, start) {
				return list[list.__index = start || list.__index || 0];
			},

			remain: function (list) {
				return list.length - (list.__index || 0);
			},

			readList: function (list, start, options, amount) {
				var res = [],
				    entry,
				    begin = start || 0,
				    end = amount ? begin + amount : list.length;
				for (var i = begin; i < end; i++) {
					res.push(Array.isArray(entry = list[i]) ? this.read(entry, 0, options) : this.read(list, i, options, 1));
				}
				return res;
			},

			readNamed: function (list, name, start, options, amount) {
				var value = this.getNamed(list, name),
				    hasObject = value !== undefined;
				if (hasObject) {
					var filtered = list._filtered;
					if (!filtered) {
						filtered = list._filtered = Base.create(list[0]);
						filtered._unfiltered = list[0];
					}
					filtered[name] = undefined;
				}
				return this.read(hasObject ? [value] : list, start, options, amount);
			},

			getNamed: function (list, name) {
				var arg = list[0];
				if (list._hasObject === undefined) list._hasObject = list.length === 1 && Base.isPlainObject(arg);
				if (list._hasObject) return name ? arg[name] : list._filtered || arg;
			},

			hasNamed: function (list, name) {
				return !!this.getNamed(list, name);
			},

			filter: function (dest, source, exclude, prioritize) {
				var processed;

				function handleKey(key) {
					if (!(exclude && key in exclude) && !(processed && key in processed)) {
						var value = source[key];
						if (value !== undefined) dest[key] = value;
					}
				}

				if (prioritize) {
					var keys = {};
					for (var i = 0, key, l = prioritize.length; i < l; i++) {
						if ((key = prioritize[i]) in source) {
							handleKey(key);
							keys[key] = true;
						}
					}
					processed = keys;
				}

				Object.keys(source._unfiltered || source).forEach(handleKey);
				return dest;
			},

			isPlainValue: function (obj, asString) {
				return Base.isPlainObject(obj) || Array.isArray(obj) || asString && typeof obj === 'string';
			},

			serialize: function (obj, options, compact, dictionary) {
				options = options || {};

				var isRoot = !dictionary,
				    res;
				if (isRoot) {
					options.formatter = new Formatter(options.precision);
					dictionary = {
						length: 0,
						definitions: {},
						references: {},
						add: function (item, create) {
							var id = '#' + item._id,
							    ref = this.references[id];
							if (!ref) {
								this.length++;
								var res = create.call(item),
								    name = item._class;
								if (name && res[0] !== name) res.unshift(name);
								this.definitions[id] = res;
								ref = this.references[id] = [id];
							}
							return ref;
						}
					};
				}
				if (obj && obj._serialize) {
					res = obj._serialize(options, dictionary);
					var name = obj._class;
					if (name && !obj._compactSerialize && (isRoot || !compact) && res[0] !== name) {
						res.unshift(name);
					}
				} else if (Array.isArray(obj)) {
					res = [];
					for (var i = 0, l = obj.length; i < l; i++) res[i] = Base.serialize(obj[i], options, compact, dictionary);
				} else if (Base.isPlainObject(obj)) {
					res = {};
					var keys = Object.keys(obj);
					for (var i = 0, l = keys.length; i < l; i++) {
						var key = keys[i];
						res[key] = Base.serialize(obj[key], options, compact, dictionary);
					}
				} else if (typeof obj === 'number') {
					res = options.formatter.number(obj, options.precision);
				} else {
					res = obj;
				}
				return isRoot && dictionary.length > 0 ? [['dictionary', dictionary.definitions], res] : res;
			},

			deserialize: function (json, create, _data, _setDictionary, _isRoot) {
				var res = json,
				    isFirst = !_data,
				    hasDictionary = isFirst && json && json.length && json[0][0] === 'dictionary';
				_data = _data || {};
				if (Array.isArray(json)) {
					var type = json[0],
					    isDictionary = type === 'dictionary';
					if (json.length == 1 && /^#/.test(type)) {
						return _data.dictionary[type];
					}
					type = Base.exports[type];
					res = [];
					for (var i = type ? 1 : 0, l = json.length; i < l; i++) {
						res.push(Base.deserialize(json[i], create, _data, isDictionary, hasDictionary));
					}
					if (type) {
						var args = res;
						if (create) {
							res = create(type, args, isFirst || _isRoot);
						} else {
							res = Base.create(type.prototype);
							type.apply(res, args);
						}
					}
				} else if (Base.isPlainObject(json)) {
					res = {};
					if (_setDictionary) _data.dictionary = res;
					for (var key in json) res[key] = Base.deserialize(json[key], create, _data);
				}
				return hasDictionary ? res[1] : res;
			},

			exportJSON: function (obj, options) {
				var json = Base.serialize(obj, options);
				return options && options.asString === false ? json : JSON.stringify(json);
			},

			importJSON: function (json, target) {
				return Base.deserialize(typeof json === 'string' ? JSON.parse(json) : json, function (ctor, args, isRoot) {
					var useTarget = isRoot && target && target.constructor === ctor,
					    obj = useTarget ? target : Base.create(ctor.prototype);
					if (args.length === 1 && obj instanceof Item && (useTarget || !(obj instanceof Layer))) {
						var arg = args[0];
						if (Base.isPlainObject(arg)) arg.insert = false;
					}
					(useTarget ? obj.set : ctor).apply(obj, args);
					if (useTarget) target = null;
					return obj;
				});
			},

			splice: function (list, items, index, remove) {
				var amount = items && items.length,
				    append = index === undefined;
				index = append ? list.length : index;
				if (index > list.length) index = list.length;
				for (var i = 0; i < amount; i++) items[i]._index = index + i;
				if (append) {
					list.push.apply(list, items);
					return [];
				} else {
					var args = [index, remove];
					if (items) args.push.apply(args, items);
					var removed = list.splice.apply(list, args);
					for (var i = 0, l = removed.length; i < l; i++) removed[i]._index = undefined;
					for (var i = index + amount, l = list.length; i < l; i++) list[i]._index = i;
					return removed;
				}
			},

			capitalize: function (str) {
				return str.replace(/\b[a-z]/g, function (match) {
					return match.toUpperCase();
				});
			},

			camelize: function (str) {
				return str.replace(/-(.)/g, function (match, chr) {
					return chr.toUpperCase();
				});
			},

			hyphenate: function (str) {
				return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
			}
		}
	});

	var Emitter = {
		on: function (type, func) {
			if (typeof type !== 'string') {
				Base.each(type, function (value, key) {
					this.on(key, value);
				}, this);
			} else {
				var types = this._eventTypes,
				    entry = types && types[type],
				    handlers = this._callbacks = this._callbacks || {};
				handlers = handlers[type] = handlers[type] || [];
				if (handlers.indexOf(func) === -1) {
					handlers.push(func);
					if (entry && entry.install && handlers.length === 1) entry.install.call(this, type);
				}
			}
			return this;
		},

		off: function (type, func) {
			if (typeof type !== 'string') {
				Base.each(type, function (value, key) {
					this.off(key, value);
				}, this);
				return;
			}
			var types = this._eventTypes,
			    entry = types && types[type],
			    handlers = this._callbacks && this._callbacks[type],
			    index;
			if (handlers) {
				if (!func || (index = handlers.indexOf(func)) !== -1 && handlers.length === 1) {
					if (entry && entry.uninstall) entry.uninstall.call(this, type);
					delete this._callbacks[type];
				} else if (index !== -1) {
					handlers.splice(index, 1);
				}
			}
			return this;
		},

		once: function (type, func) {
			return this.on(type, function () {
				func.apply(this, arguments);
				this.off(type, func);
			});
		},

		emit: function (type, event) {
			var handlers = this._callbacks && this._callbacks[type];
			if (!handlers) return false;
			var args = Base.slice(arguments, 1),
			    setTarget = event && event.target && !event.currentTarget;
			handlers = handlers.slice();
			if (setTarget) event.currentTarget = this;
			for (var i = 0, l = handlers.length; i < l; i++) {
				if (handlers[i].apply(this, args) === false) {
					if (event && event.stop) event.stop();
					break;
				}
			}
			if (setTarget) delete event.currentTarget;
			return true;
		},

		responds: function (type) {
			return !!(this._callbacks && this._callbacks[type]);
		},

		attach: '#on',
		detach: '#off',
		fire: '#emit',

		_installEvents: function (install) {
			var types = this._eventTypes,
			    handlers = this._callbacks,
			    key = install ? 'install' : 'uninstall';
			if (types) {
				for (var type in handlers) {
					if (handlers[type].length > 0) {
						var entry = types[type],
						    func = entry && entry[key];
						if (func) func.call(this, type);
					}
				}
			}
		},

		statics: {
			inject: function inject(src) {
				var events = src._events;
				if (events) {
					var types = {};
					Base.each(events, function (entry, key) {
						var isString = typeof entry === 'string',
						    name = isString ? entry : key,
						    part = Base.capitalize(name),
						    type = name.substring(2).toLowerCase();
						types[type] = isString ? {} : entry;
						name = '_' + name;
						src['get' + part] = function () {
							return this[name];
						};
						src['set' + part] = function (func) {
							var prev = this[name];
							if (prev) this.off(type, prev);
							if (func) this.on(type, func);
							this[name] = func;
						};
					});
					src._eventTypes = types;
				}
				return inject.base.apply(this, arguments);
			}
		}
	};

	var PaperScope = Base.extend({
		_class: 'PaperScope',

		initialize: function PaperScope() {
			paper = this;
			this.settings = new Base({
				applyMatrix: true,
				insertItems: true,
				handleSize: 4,
				hitTolerance: 0
			});
			this.project = null;
			this.projects = [];
			this.tools = [];
			this.palettes = [];
			this._id = PaperScope._id++;
			PaperScope._scopes[this._id] = this;
			var proto = PaperScope.prototype;
			if (!this.support) {
				var ctx = CanvasProvider.getContext(1, 1) || {};
				proto.support = {
					nativeDash: 'setLineDash' in ctx || 'mozDash' in ctx,
					nativeBlendModes: BlendMode.nativeModes
				};
				CanvasProvider.release(ctx);
			}
			if (!this.agent) {
				var user = self.navigator.userAgent.toLowerCase(),
				    os = (/(darwin|win|mac|linux|freebsd|sunos)/.exec(user) || [])[0],
				    platform = os === 'darwin' ? 'mac' : os,
				    agent = proto.agent = proto.browser = { platform: platform };
				if (platform) agent[platform] = true;
				user.replace(/(opera|chrome|safari|webkit|firefox|msie|trident|atom|node)\/?\s*([.\d]+)(?:.*version\/([.\d]+))?(?:.*rv\:v?([.\d]+))?/g, function (match, n, v1, v2, rv) {
					if (!agent.chrome) {
						var v = n === 'opera' ? v2 : /^(node|trident)$/.test(n) ? rv : v1;
						agent.version = v;
						agent.versionNumber = parseFloat(v);
						n = n === 'trident' ? 'msie' : n;
						agent.name = n;
						agent[n] = true;
					}
				});
				if (agent.chrome) delete agent.webkit;
				if (agent.atom) delete agent.chrome;
			}
		},

		version: "0.10.3",

		getView: function () {
			var project = this.project;
			return project && project._view;
		},

		getPaper: function () {
			return this;
		},

		execute: function (code, options) {
			paper.PaperScript.execute(code, this, options);
			View.updateFocus();
		},

		install: function (scope) {
			var that = this;
			Base.each(['project', 'view', 'tool'], function (key) {
				Base.define(scope, key, {
					configurable: true,
					get: function () {
						return that[key];
					}
				});
			});
			for (var key in this) if (!/^_/.test(key) && this[key]) scope[key] = this[key];
		},

		setup: function (element) {
			paper = this;
			this.project = new Project(element);
			return this;
		},

		createCanvas: function (width, height) {
			return CanvasProvider.getCanvas(width, height);
		},

		activate: function () {
			paper = this;
		},

		clear: function () {
			var projects = this.projects,
			    tools = this.tools,
			    palettes = this.palettes;
			for (var i = projects.length - 1; i >= 0; i--) projects[i].remove();
			for (var i = tools.length - 1; i >= 0; i--) tools[i].remove();
			for (var i = palettes.length - 1; i >= 0; i--) palettes[i].remove();
		},

		remove: function () {
			this.clear();
			delete PaperScope._scopes[this._id];
		},

		statics: new function () {
			function handleAttribute(name) {
				name += 'Attribute';
				return function (el, attr) {
					return el[name](attr) || el[name]('data-paper-' + attr);
				};
			}

			return {
				_scopes: {},
				_id: 0,

				get: function (id) {
					return this._scopes[id] || null;
				},

				getAttribute: handleAttribute('get'),
				hasAttribute: handleAttribute('has')
			};
		}()
	});

	var PaperScopeItem = Base.extend(Emitter, {

		initialize: function (activate) {
			this._scope = paper;
			this._index = this._scope[this._list].push(this) - 1;
			if (activate || !this._scope[this._reference]) this.activate();
		},

		activate: function () {
			if (!this._scope) return false;
			var prev = this._scope[this._reference];
			if (prev && prev !== this) prev.emit('deactivate');
			this._scope[this._reference] = this;
			this.emit('activate', prev);
			return true;
		},

		isActive: function () {
			return this._scope[this._reference] === this;
		},

		remove: function () {
			if (this._index == null) return false;
			Base.splice(this._scope[this._list], null, this._index, 1);
			if (this._scope[this._reference] == this) this._scope[this._reference] = null;
			this._scope = null;
			return true;
		},

		getView: function () {
			return this._scope.getView();
		}
	});

	var Formatter = Base.extend({
		initialize: function (precision) {
			this.precision = Base.pick(precision, 5);
			this.multiplier = Math.pow(10, this.precision);
		},

		number: function (val) {
			return this.precision < 16 ? Math.round(val * this.multiplier) / this.multiplier : val;
		},

		pair: function (val1, val2, separator) {
			return this.number(val1) + (separator || ',') + this.number(val2);
		},

		point: function (val, separator) {
			return this.number(val.x) + (separator || ',') + this.number(val.y);
		},

		size: function (val, separator) {
			return this.number(val.width) + (separator || ',') + this.number(val.height);
		},

		rectangle: function (val, separator) {
			return this.point(val, separator) + (separator || ',') + this.size(val, separator);
		}
	});

	Formatter.instance = new Formatter();

	var Numerical = new function () {

		var abscissas = [[0.5773502691896257645091488], [0, 0.7745966692414833770358531], [0.3399810435848562648026658, 0.8611363115940525752239465], [0, 0.5384693101056830910363144, 0.9061798459386639927976269], [0.2386191860831969086305017, 0.6612093864662645136613996, 0.9324695142031520278123016], [0, 0.4058451513773971669066064, 0.7415311855993944398638648, 0.9491079123427585245261897], [0.1834346424956498049394761, 0.5255324099163289858177390, 0.7966664774136267395915539, 0.9602898564975362316835609], [0, 0.3242534234038089290385380, 0.6133714327005903973087020, 0.8360311073266357942994298, 0.9681602395076260898355762], [0.1488743389816312108848260, 0.4333953941292471907992659, 0.6794095682990244062343274, 0.8650633666889845107320967, 0.9739065285171717200779640], [0, 0.2695431559523449723315320, 0.5190961292068118159257257, 0.7301520055740493240934163, 0.8870625997680952990751578, 0.9782286581460569928039380], [0.1252334085114689154724414, 0.3678314989981801937526915, 0.5873179542866174472967024, 0.7699026741943046870368938, 0.9041172563704748566784659, 0.9815606342467192506905491], [0, 0.2304583159551347940655281, 0.4484927510364468528779129, 0.6423493394403402206439846, 0.8015780907333099127942065, 0.9175983992229779652065478, 0.9841830547185881494728294], [0.1080549487073436620662447, 0.3191123689278897604356718, 0.5152486363581540919652907, 0.6872929048116854701480198, 0.8272013150697649931897947, 0.9284348836635735173363911, 0.9862838086968123388415973], [0, 0.2011940939974345223006283, 0.3941513470775633698972074, 0.5709721726085388475372267, 0.7244177313601700474161861, 0.8482065834104272162006483, 0.9372733924007059043077589, 0.9879925180204854284895657], [0.0950125098376374401853193, 0.2816035507792589132304605, 0.4580167776572273863424194, 0.6178762444026437484466718, 0.7554044083550030338951012, 0.8656312023878317438804679, 0.9445750230732325760779884, 0.9894009349916499325961542]];

		var weights = [[1], [0.8888888888888888888888889, 0.5555555555555555555555556], [0.6521451548625461426269361, 0.3478548451374538573730639], [0.5688888888888888888888889, 0.4786286704993664680412915, 0.2369268850561890875142640], [0.4679139345726910473898703, 0.3607615730481386075698335, 0.1713244923791703450402961], [0.4179591836734693877551020, 0.3818300505051189449503698, 0.2797053914892766679014678, 0.1294849661688696932706114], [0.3626837833783619829651504, 0.3137066458778872873379622, 0.2223810344533744705443560, 0.1012285362903762591525314], [0.3302393550012597631645251, 0.3123470770400028400686304, 0.2606106964029354623187429, 0.1806481606948574040584720, 0.0812743883615744119718922], [0.2955242247147528701738930, 0.2692667193099963550912269, 0.2190863625159820439955349, 0.1494513491505805931457763, 0.0666713443086881375935688], [0.2729250867779006307144835, 0.2628045445102466621806889, 0.2331937645919904799185237, 0.1862902109277342514260976, 0.1255803694649046246346943, 0.0556685671161736664827537], [0.2491470458134027850005624, 0.2334925365383548087608499, 0.2031674267230659217490645, 0.1600783285433462263346525, 0.1069393259953184309602547, 0.0471753363865118271946160], [0.2325515532308739101945895, 0.2262831802628972384120902, 0.2078160475368885023125232, 0.1781459807619457382800467, 0.1388735102197872384636018, 0.0921214998377284479144218, 0.0404840047653158795200216], [0.2152638534631577901958764, 0.2051984637212956039659241, 0.1855383974779378137417166, 0.1572031671581935345696019, 0.1215185706879031846894148, 0.0801580871597602098056333, 0.0351194603317518630318329], [0.2025782419255612728806202, 0.1984314853271115764561183, 0.1861610000155622110268006, 0.1662692058169939335532009, 0.1395706779261543144478048, 0.1071592204671719350118695, 0.0703660474881081247092674, 0.0307532419961172683546284], [0.1894506104550684962853967, 0.1826034150449235888667637, 0.1691565193950025381893121, 0.1495959888165767320815017, 0.1246289712555338720524763, 0.0951585116824927848099251, 0.0622535239386478928628438, 0.0271524594117540948517806]];

		var abs = Math.abs,
		    sqrt = Math.sqrt,
		    pow = Math.pow,
		    log2 = Math.log2 || function (x) {
			return Math.log(x) * Math.LOG2E;
		},
		    EPSILON = 1e-12,
		    MACHINE_EPSILON = 1.12e-16;

		function clamp(value, min, max) {
			return value < min ? min : value > max ? max : value;
		}

		function getDiscriminant(a, b, c) {
			function split(v) {
				var x = v * 134217729,
				    y = v - x,
				    hi = y + x,
				    lo = v - hi;
				return [hi, lo];
			}

			var D = b * b - a * c,
			    E = b * b + a * c;
			if (abs(D) * 3 < E) {
				var ad = split(a),
				    bd = split(b),
				    cd = split(c),
				    p = b * b,
				    dp = bd[0] * bd[0] - p + 2 * bd[0] * bd[1] + bd[1] * bd[1],
				    q = a * c,
				    dq = ad[0] * cd[0] - q + ad[0] * cd[1] + ad[1] * cd[0] + ad[1] * cd[1];
				D = p - q + (dp - dq);
			}
			return D;
		}

		function getNormalizationFactor() {
			var norm = Math.max.apply(Math, arguments);
			return norm && (norm < 1e-8 || norm > 1e8) ? pow(2, -Math.round(log2(norm))) : 0;
		}

		return {
			EPSILON: EPSILON,
			MACHINE_EPSILON: MACHINE_EPSILON,
			CURVETIME_EPSILON: 1e-8,
			GEOMETRIC_EPSILON: 1e-7,
			TRIGONOMETRIC_EPSILON: 1e-8,
			KAPPA: 4 * (sqrt(2) - 1) / 3,

			isZero: function (val) {
				return val >= -EPSILON && val <= EPSILON;
			},

			clamp: clamp,

			integrate: function (f, a, b, n) {
				var x = abscissas[n - 2],
				    w = weights[n - 2],
				    A = (b - a) * 0.5,
				    B = A + a,
				    i = 0,
				    m = n + 1 >> 1,
				    sum = n & 1 ? w[i++] * f(B) : 0;
				while (i < m) {
					var Ax = A * x[i];
					sum += w[i++] * (f(B + Ax) + f(B - Ax));
				}
				return A * sum;
			},

			findRoot: function (f, df, x, a, b, n, tolerance) {
				for (var i = 0; i < n; i++) {
					var fx = f(x),
					    dx = fx / df(x),
					    nx = x - dx;
					if (abs(dx) < tolerance) {
						x = nx;
						break;
					}
					if (fx > 0) {
						b = x;
						x = nx <= a ? (a + b) * 0.5 : nx;
					} else {
						a = x;
						x = nx >= b ? (a + b) * 0.5 : nx;
					}
				}
				return clamp(x, a, b);
			},

			solveQuadratic: function (a, b, c, roots, min, max) {
				var x1,
				    x2 = Infinity;
				if (abs(a) < EPSILON) {
					if (abs(b) < EPSILON) return abs(c) < EPSILON ? -1 : 0;
					x1 = -c / b;
				} else {
					b *= -0.5;
					var D = getDiscriminant(a, b, c);
					if (D && abs(D) < MACHINE_EPSILON) {
						var f = getNormalizationFactor(abs(a), abs(b), abs(c));
						if (f) {
							a *= f;
							b *= f;
							c *= f;
							D = getDiscriminant(a, b, c);
						}
					}
					if (D >= -MACHINE_EPSILON) {
						var Q = D < 0 ? 0 : sqrt(D),
						    R = b + (b < 0 ? -Q : Q);
						if (R === 0) {
							x1 = c / a;
							x2 = -x1;
						} else {
							x1 = R / a;
							x2 = c / R;
						}
					}
				}
				var count = 0,
				    boundless = min == null,
				    minB = min - EPSILON,
				    maxB = max + EPSILON;
				if (isFinite(x1) && (boundless || x1 > minB && x1 < maxB)) roots[count++] = boundless ? x1 : clamp(x1, min, max);
				if (x2 !== x1 && isFinite(x2) && (boundless || x2 > minB && x2 < maxB)) roots[count++] = boundless ? x2 : clamp(x2, min, max);
				return count;
			},

			solveCubic: function (a, b, c, d, roots, min, max) {
				var f = getNormalizationFactor(abs(a), abs(b), abs(c), abs(d)),
				    x,
				    b1,
				    c2,
				    qd,
				    q;
				if (f) {
					a *= f;
					b *= f;
					c *= f;
					d *= f;
				}

				function evaluate(x0) {
					x = x0;
					var tmp = a * x;
					b1 = tmp + b;
					c2 = b1 * x + c;
					qd = (tmp + b1) * x + c2;
					q = c2 * x + d;
				}

				if (abs(a) < EPSILON) {
					a = b;
					b1 = c;
					c2 = d;
					x = Infinity;
				} else if (abs(d) < EPSILON) {
					b1 = b;
					c2 = c;
					x = 0;
				} else {
					evaluate(-(b / a) / 3);
					var t = q / a,
					    r = pow(abs(t), 1 / 3),
					    s = t < 0 ? -1 : 1,
					    td = -qd / a,
					    rd = td > 0 ? 1.324717957244746 * Math.max(r, sqrt(td)) : r,
					    x0 = x - s * rd;
					if (x0 !== x) {
						do {
							evaluate(x0);
							x0 = qd === 0 ? x : x - q / qd / (1 + MACHINE_EPSILON);
						} while (s * x0 > s * x);
						if (abs(a) * x * x > abs(d / x)) {
							c2 = -d / x;
							b1 = (c2 - c) / x;
						}
					}
				}
				var count = Numerical.solveQuadratic(a, b1, c2, roots, min, max),
				    boundless = min == null;
				if (isFinite(x) && (count === 0 || count > 0 && x !== roots[0] && x !== roots[1]) && (boundless || x > min - EPSILON && x < max + EPSILON)) roots[count++] = boundless ? x : clamp(x, min, max);
				return count;
			}
		};
	}();

	var UID = {
		_id: 1,
		_pools: {},

		get: function (name) {
			if (name) {
				var pool = this._pools[name];
				if (!pool) pool = this._pools[name] = { _id: 1 };
				return pool._id++;
			} else {
				return this._id++;
			}
		}
	};

	var Point = Base.extend({
		_class: 'Point',
		_readIndex: true,

		initialize: function Point(arg0, arg1) {
			var type = typeof arg0,
			    reading = this.__read,
			    read = 0;
			if (type === 'number') {
				var hasY = typeof arg1 === 'number';
				this._set(arg0, hasY ? arg1 : arg0);
				if (reading) read = hasY ? 2 : 1;
			} else if (type === 'undefined' || arg0 === null) {
				this._set(0, 0);
				if (reading) read = arg0 === null ? 1 : 0;
			} else {
				var obj = type === 'string' ? arg0.split(/[\s,]+/) || [] : arg0;
				read = 1;
				if (Array.isArray(obj)) {
					this._set(+obj[0], +(obj.length > 1 ? obj[1] : obj[0]));
				} else if ('x' in obj) {
					this._set(obj.x || 0, obj.y || 0);
				} else if ('width' in obj) {
					this._set(obj.width || 0, obj.height || 0);
				} else if ('angle' in obj) {
					this._set(obj.length || 0, 0);
					this.setAngle(obj.angle || 0);
				} else {
					this._set(0, 0);
					read = 0;
				}
			}
			if (reading) this.__read = read;
			return this;
		},

		set: '#initialize',

		_set: function (x, y) {
			this.x = x;
			this.y = y;
			return this;
		},

		equals: function (point) {
			return this === point || point && (this.x === point.x && this.y === point.y || Array.isArray(point) && this.x === point[0] && this.y === point[1]) || false;
		},

		clone: function () {
			return new Point(this.x, this.y);
		},

		toString: function () {
			var f = Formatter.instance;
			return '{ x: ' + f.number(this.x) + ', y: ' + f.number(this.y) + ' }';
		},

		_serialize: function (options) {
			var f = options.formatter;
			return [f.number(this.x), f.number(this.y)];
		},

		getLength: function () {
			return Math.sqrt(this.x * this.x + this.y * this.y);
		},

		setLength: function (length) {
			if (this.isZero()) {
				var angle = this._angle || 0;
				this._set(Math.cos(angle) * length, Math.sin(angle) * length);
			} else {
				var scale = length / this.getLength();
				if (Numerical.isZero(scale)) this.getAngle();
				this._set(this.x * scale, this.y * scale);
			}
		},
		getAngle: function () {
			return this.getAngleInRadians.apply(this, arguments) * 180 / Math.PI;
		},

		setAngle: function (angle) {
			this.setAngleInRadians.call(this, angle * Math.PI / 180);
		},

		getAngleInDegrees: '#getAngle',
		setAngleInDegrees: '#setAngle',

		getAngleInRadians: function () {
			if (!arguments.length) {
				return this.isZero() ? this._angle || 0 : this._angle = Math.atan2(this.y, this.x);
			} else {
				var point = Point.read(arguments),
				    div = this.getLength() * point.getLength();
				if (Numerical.isZero(div)) {
					return NaN;
				} else {
					var a = this.dot(point) / div;
					return Math.acos(a < -1 ? -1 : a > 1 ? 1 : a);
				}
			}
		},

		setAngleInRadians: function (angle) {
			this._angle = angle;
			if (!this.isZero()) {
				var length = this.getLength();
				this._set(Math.cos(angle) * length, Math.sin(angle) * length);
			}
		},

		getQuadrant: function () {
			return this.x >= 0 ? this.y >= 0 ? 1 : 4 : this.y >= 0 ? 2 : 3;
		}
	}, {
		beans: false,

		getDirectedAngle: function () {
			var point = Point.read(arguments);
			return Math.atan2(this.cross(point), this.dot(point)) * 180 / Math.PI;
		},

		getDistance: function () {
			var point = Point.read(arguments),
			    x = point.x - this.x,
			    y = point.y - this.y,
			    d = x * x + y * y,
			    squared = Base.read(arguments);
			return squared ? d : Math.sqrt(d);
		},

		normalize: function (length) {
			if (length === undefined) length = 1;
			var current = this.getLength(),
			    scale = current !== 0 ? length / current : 0,
			    point = new Point(this.x * scale, this.y * scale);
			if (scale >= 0) point._angle = this._angle;
			return point;
		},

		rotate: function (angle, center) {
			if (angle === 0) return this.clone();
			angle = angle * Math.PI / 180;
			var point = center ? this.subtract(center) : this,
			    sin = Math.sin(angle),
			    cos = Math.cos(angle);
			point = new Point(point.x * cos - point.y * sin, point.x * sin + point.y * cos);
			return center ? point.add(center) : point;
		},

		transform: function (matrix) {
			return matrix ? matrix._transformPoint(this) : this;
		},

		add: function () {
			var point = Point.read(arguments);
			return new Point(this.x + point.x, this.y + point.y);
		},

		subtract: function () {
			var point = Point.read(arguments);
			return new Point(this.x - point.x, this.y - point.y);
		},

		multiply: function () {
			var point = Point.read(arguments);
			return new Point(this.x * point.x, this.y * point.y);
		},

		divide: function () {
			var point = Point.read(arguments);
			return new Point(this.x / point.x, this.y / point.y);
		},

		modulo: function () {
			var point = Point.read(arguments);
			return new Point(this.x % point.x, this.y % point.y);
		},

		negate: function () {
			return new Point(-this.x, -this.y);
		},

		isInside: function () {
			return Rectangle.read(arguments).contains(this);
		},

		isClose: function () {
			var point = Point.read(arguments),
			    tolerance = Base.read(arguments);
			return this.getDistance(point) <= tolerance;
		},

		isCollinear: function () {
			var point = Point.read(arguments);
			return Point.isCollinear(this.x, this.y, point.x, point.y);
		},

		isColinear: '#isCollinear',

		isOrthogonal: function () {
			var point = Point.read(arguments);
			return Point.isOrthogonal(this.x, this.y, point.x, point.y);
		},

		isZero: function () {
			var isZero = Numerical.isZero;
			return isZero(this.x) && isZero(this.y);
		},

		isNaN: function () {
			return isNaN(this.x) || isNaN(this.y);
		},

		isInQuadrant: function (q) {
			return this.x * (q > 1 && q < 4 ? -1 : 1) >= 0 && this.y * (q > 2 ? -1 : 1) >= 0;
		},

		dot: function () {
			var point = Point.read(arguments);
			return this.x * point.x + this.y * point.y;
		},

		cross: function () {
			var point = Point.read(arguments);
			return this.x * point.y - this.y * point.x;
		},

		project: function () {
			var point = Point.read(arguments),
			    scale = point.isZero() ? 0 : this.dot(point) / point.dot(point);
			return new Point(point.x * scale, point.y * scale);
		},

		statics: {
			min: function () {
				var point1 = Point.read(arguments),
				    point2 = Point.read(arguments);
				return new Point(Math.min(point1.x, point2.x), Math.min(point1.y, point2.y));
			},

			max: function () {
				var point1 = Point.read(arguments),
				    point2 = Point.read(arguments);
				return new Point(Math.max(point1.x, point2.x), Math.max(point1.y, point2.y));
			},

			random: function () {
				return new Point(Math.random(), Math.random());
			},

			isCollinear: function (x1, y1, x2, y2) {
				return Math.abs(x1 * y2 - y1 * x2) <= Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2)) * 1e-8;
			},

			isOrthogonal: function (x1, y1, x2, y2) {
				return Math.abs(x1 * x2 + y1 * y2) <= Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2)) * 1e-8;
			}
		}
	}, Base.each(['round', 'ceil', 'floor', 'abs'], function (key) {
		var op = Math[key];
		this[key] = function () {
			return new Point(op(this.x), op(this.y));
		};
	}, {}));

	var LinkedPoint = Point.extend({
		initialize: function Point(x, y, owner, setter) {
			this._x = x;
			this._y = y;
			this._owner = owner;
			this._setter = setter;
		},

		_set: function (x, y, _dontNotify) {
			this._x = x;
			this._y = y;
			if (!_dontNotify) this._owner[this._setter](this);
			return this;
		},

		getX: function () {
			return this._x;
		},

		setX: function (x) {
			this._x = x;
			this._owner[this._setter](this);
		},

		getY: function () {
			return this._y;
		},

		setY: function (y) {
			this._y = y;
			this._owner[this._setter](this);
		},

		isSelected: function () {
			return !!(this._owner._selection & this._getSelection());
		},

		setSelected: function (selected) {
			this._owner.changeSelection(this._getSelection(), selected);
		},

		_getSelection: function () {
			return this._setter === 'setPosition' ? 4 : 0;
		}
	});

	var Size = Base.extend({
		_class: 'Size',
		_readIndex: true,

		initialize: function Size(arg0, arg1) {
			var type = typeof arg0,
			    reading = this.__read,
			    read = 0;
			if (type === 'number') {
				var hasHeight = typeof arg1 === 'number';
				this._set(arg0, hasHeight ? arg1 : arg0);
				if (reading) read = hasHeight ? 2 : 1;
			} else if (type === 'undefined' || arg0 === null) {
				this._set(0, 0);
				if (reading) read = arg0 === null ? 1 : 0;
			} else {
				var obj = type === 'string' ? arg0.split(/[\s,]+/) || [] : arg0;
				read = 1;
				if (Array.isArray(obj)) {
					this._set(+obj[0], +(obj.length > 1 ? obj[1] : obj[0]));
				} else if ('width' in obj) {
					this._set(obj.width || 0, obj.height || 0);
				} else if ('x' in obj) {
					this._set(obj.x || 0, obj.y || 0);
				} else {
					this._set(0, 0);
					read = 0;
				}
			}
			if (reading) this.__read = read;
			return this;
		},

		set: '#initialize',

		_set: function (width, height) {
			this.width = width;
			this.height = height;
			return this;
		},

		equals: function (size) {
			return size === this || size && (this.width === size.width && this.height === size.height || Array.isArray(size) && this.width === size[0] && this.height === size[1]) || false;
		},

		clone: function () {
			return new Size(this.width, this.height);
		},

		toString: function () {
			var f = Formatter.instance;
			return '{ width: ' + f.number(this.width) + ', height: ' + f.number(this.height) + ' }';
		},

		_serialize: function (options) {
			var f = options.formatter;
			return [f.number(this.width), f.number(this.height)];
		},

		add: function () {
			var size = Size.read(arguments);
			return new Size(this.width + size.width, this.height + size.height);
		},

		subtract: function () {
			var size = Size.read(arguments);
			return new Size(this.width - size.width, this.height - size.height);
		},

		multiply: function () {
			var size = Size.read(arguments);
			return new Size(this.width * size.width, this.height * size.height);
		},

		divide: function () {
			var size = Size.read(arguments);
			return new Size(this.width / size.width, this.height / size.height);
		},

		modulo: function () {
			var size = Size.read(arguments);
			return new Size(this.width % size.width, this.height % size.height);
		},

		negate: function () {
			return new Size(-this.width, -this.height);
		},

		isZero: function () {
			var isZero = Numerical.isZero;
			return isZero(this.width) && isZero(this.height);
		},

		isNaN: function () {
			return isNaN(this.width) || isNaN(this.height);
		},

		statics: {
			min: function (size1, size2) {
				return new Size(Math.min(size1.width, size2.width), Math.min(size1.height, size2.height));
			},

			max: function (size1, size2) {
				return new Size(Math.max(size1.width, size2.width), Math.max(size1.height, size2.height));
			},

			random: function () {
				return new Size(Math.random(), Math.random());
			}
		}
	}, Base.each(['round', 'ceil', 'floor', 'abs'], function (key) {
		var op = Math[key];
		this[key] = function () {
			return new Size(op(this.width), op(this.height));
		};
	}, {}));

	var LinkedSize = Size.extend({
		initialize: function Size(width, height, owner, setter) {
			this._width = width;
			this._height = height;
			this._owner = owner;
			this._setter = setter;
		},

		_set: function (width, height, _dontNotify) {
			this._width = width;
			this._height = height;
			if (!_dontNotify) this._owner[this._setter](this);
			return this;
		},

		getWidth: function () {
			return this._width;
		},

		setWidth: function (width) {
			this._width = width;
			this._owner[this._setter](this);
		},

		getHeight: function () {
			return this._height;
		},

		setHeight: function (height) {
			this._height = height;
			this._owner[this._setter](this);
		}
	});

	var Rectangle = Base.extend({
		_class: 'Rectangle',
		_readIndex: true,
		beans: true,

		initialize: function Rectangle(arg0, arg1, arg2, arg3) {
			var type = typeof arg0,
			    read;
			if (type === 'number') {
				this._set(arg0, arg1, arg2, arg3);
				read = 4;
			} else if (type === 'undefined' || arg0 === null) {
				this._set(0, 0, 0, 0);
				read = arg0 === null ? 1 : 0;
			} else if (arguments.length === 1) {
				if (Array.isArray(arg0)) {
					this._set.apply(this, arg0);
					read = 1;
				} else if (arg0.x !== undefined || arg0.width !== undefined) {
					this._set(arg0.x || 0, arg0.y || 0, arg0.width || 0, arg0.height || 0);
					read = 1;
				} else if (arg0.from === undefined && arg0.to === undefined) {
					this._set(0, 0, 0, 0);
					Base.filter(this, arg0);
					read = 1;
				}
			}
			if (read === undefined) {
				var frm = Point.readNamed(arguments, 'from'),
				    next = Base.peek(arguments),
				    x = frm.x,
				    y = frm.y,
				    width,
				    height;
				if (next && next.x !== undefined || Base.hasNamed(arguments, 'to')) {
					var to = Point.readNamed(arguments, 'to');
					width = to.x - x;
					height = to.y - y;
					if (width < 0) {
						x = to.x;
						width = -width;
					}
					if (height < 0) {
						y = to.y;
						height = -height;
					}
				} else {
					var size = Size.read(arguments);
					width = size.width;
					height = size.height;
				}
				this._set(x, y, width, height);
				read = arguments.__index;
			}
			if (this.__read) this.__read = read;
			return this;
		},

		set: '#initialize',

		_set: function (x, y, width, height) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
			return this;
		},

		clone: function () {
			return new Rectangle(this.x, this.y, this.width, this.height);
		},

		equals: function (rect) {
			var rt = Base.isPlainValue(rect) ? Rectangle.read(arguments) : rect;
			return rt === this || rt && this.x === rt.x && this.y === rt.y && this.width === rt.width && this.height === rt.height || false;
		},

		toString: function () {
			var f = Formatter.instance;
			return '{ x: ' + f.number(this.x) + ', y: ' + f.number(this.y) + ', width: ' + f.number(this.width) + ', height: ' + f.number(this.height) + ' }';
		},

		_serialize: function (options) {
			var f = options.formatter;
			return [f.number(this.x), f.number(this.y), f.number(this.width), f.number(this.height)];
		},

		getPoint: function (_dontLink) {
			var ctor = _dontLink ? Point : LinkedPoint;
			return new ctor(this.x, this.y, this, 'setPoint');
		},

		setPoint: function () {
			var point = Point.read(arguments);
			this.x = point.x;
			this.y = point.y;
		},

		getSize: function (_dontLink) {
			var ctor = _dontLink ? Size : LinkedSize;
			return new ctor(this.width, this.height, this, 'setSize');
		},

		setSize: function () {
			var size = Size.read(arguments);
			if (this._fixX) this.x += (this.width - size.width) * this._fixX;
			if (this._fixY) this.y += (this.height - size.height) * this._fixY;
			this.width = size.width;
			this.height = size.height;
			this._fixW = 1;
			this._fixH = 1;
		},

		getLeft: function () {
			return this.x;
		},

		setLeft: function (left) {
			if (!this._fixW) this.width -= left - this.x;
			this.x = left;
			this._fixX = 0;
		},

		getTop: function () {
			return this.y;
		},

		setTop: function (top) {
			if (!this._fixH) this.height -= top - this.y;
			this.y = top;
			this._fixY = 0;
		},

		getRight: function () {
			return this.x + this.width;
		},

		setRight: function (right) {
			if (this._fixX !== undefined && this._fixX !== 1) this._fixW = 0;
			if (this._fixW) this.x = right - this.width;else this.width = right - this.x;
			this._fixX = 1;
		},

		getBottom: function () {
			return this.y + this.height;
		},

		setBottom: function (bottom) {
			if (this._fixY !== undefined && this._fixY !== 1) this._fixH = 0;
			if (this._fixH) this.y = bottom - this.height;else this.height = bottom - this.y;
			this._fixY = 1;
		},

		getCenterX: function () {
			return this.x + this.width * 0.5;
		},

		setCenterX: function (x) {
			this.x = x - this.width * 0.5;
			this._fixX = 0.5;
		},

		getCenterY: function () {
			return this.y + this.height * 0.5;
		},

		setCenterY: function (y) {
			this.y = y - this.height * 0.5;
			this._fixY = 0.5;
		},

		getCenter: function (_dontLink) {
			var ctor = _dontLink ? Point : LinkedPoint;
			return new ctor(this.getCenterX(), this.getCenterY(), this, 'setCenter');
		},

		setCenter: function () {
			var point = Point.read(arguments);
			this.setCenterX(point.x);
			this.setCenterY(point.y);
			return this;
		},

		getArea: function () {
			return this.width * this.height;
		},

		isEmpty: function () {
			return this.width === 0 || this.height === 0;
		},

		contains: function (arg) {
			return arg && arg.width !== undefined || (Array.isArray(arg) ? arg : arguments).length === 4 ? this._containsRectangle(Rectangle.read(arguments)) : this._containsPoint(Point.read(arguments));
		},

		_containsPoint: function (point) {
			var x = point.x,
			    y = point.y;
			return x >= this.x && y >= this.y && x <= this.x + this.width && y <= this.y + this.height;
		},

		_containsRectangle: function (rect) {
			var x = rect.x,
			    y = rect.y;
			return x >= this.x && y >= this.y && x + rect.width <= this.x + this.width && y + rect.height <= this.y + this.height;
		},

		intersects: function () {
			var rect = Rectangle.read(arguments);
			return rect.x + rect.width > this.x && rect.y + rect.height > this.y && rect.x < this.x + this.width && rect.y < this.y + this.height;
		},

		touches: function () {
			var rect = Rectangle.read(arguments);
			return rect.x + rect.width >= this.x && rect.y + rect.height >= this.y && rect.x <= this.x + this.width && rect.y <= this.y + this.height;
		},

		intersect: function () {
			var rect = Rectangle.read(arguments),
			    x1 = Math.max(this.x, rect.x),
			    y1 = Math.max(this.y, rect.y),
			    x2 = Math.min(this.x + this.width, rect.x + rect.width),
			    y2 = Math.min(this.y + this.height, rect.y + rect.height);
			return new Rectangle(x1, y1, x2 - x1, y2 - y1);
		},

		unite: function () {
			var rect = Rectangle.read(arguments),
			    x1 = Math.min(this.x, rect.x),
			    y1 = Math.min(this.y, rect.y),
			    x2 = Math.max(this.x + this.width, rect.x + rect.width),
			    y2 = Math.max(this.y + this.height, rect.y + rect.height);
			return new Rectangle(x1, y1, x2 - x1, y2 - y1);
		},

		include: function () {
			var point = Point.read(arguments);
			var x1 = Math.min(this.x, point.x),
			    y1 = Math.min(this.y, point.y),
			    x2 = Math.max(this.x + this.width, point.x),
			    y2 = Math.max(this.y + this.height, point.y);
			return new Rectangle(x1, y1, x2 - x1, y2 - y1);
		},

		expand: function () {
			var amount = Size.read(arguments),
			    hor = amount.width,
			    ver = amount.height;
			return new Rectangle(this.x - hor / 2, this.y - ver / 2, this.width + hor, this.height + ver);
		},

		scale: function (hor, ver) {
			return this.expand(this.width * hor - this.width, this.height * (ver === undefined ? hor : ver) - this.height);
		}
	}, Base.each([['Top', 'Left'], ['Top', 'Right'], ['Bottom', 'Left'], ['Bottom', 'Right'], ['Left', 'Center'], ['Top', 'Center'], ['Right', 'Center'], ['Bottom', 'Center']], function (parts, index) {
		var part = parts.join(''),
		    xFirst = /^[RL]/.test(part);
		if (index >= 4) parts[1] += xFirst ? 'Y' : 'X';
		var x = parts[xFirst ? 0 : 1],
		    y = parts[xFirst ? 1 : 0],
		    getX = 'get' + x,
		    getY = 'get' + y,
		    setX = 'set' + x,
		    setY = 'set' + y,
		    get = 'get' + part,
		    set = 'set' + part;
		this[get] = function (_dontLink) {
			var ctor = _dontLink ? Point : LinkedPoint;
			return new ctor(this[getX](), this[getY](), this, set);
		};
		this[set] = function () {
			var point = Point.read(arguments);
			this[setX](point.x);
			this[setY](point.y);
		};
	}, {
		beans: true
	}));

	var LinkedRectangle = Rectangle.extend({
		initialize: function Rectangle(x, y, width, height, owner, setter) {
			this._set(x, y, width, height, true);
			this._owner = owner;
			this._setter = setter;
		},

		_set: function (x, y, width, height, _dontNotify) {
			this._x = x;
			this._y = y;
			this._width = width;
			this._height = height;
			if (!_dontNotify) this._owner[this._setter](this);
			return this;
		}
	}, new function () {
		var proto = Rectangle.prototype;

		return Base.each(['x', 'y', 'width', 'height'], function (key) {
			var part = Base.capitalize(key),
			    internal = '_' + key;
			this['get' + part] = function () {
				return this[internal];
			};

			this['set' + part] = function (value) {
				this[internal] = value;
				if (!this._dontNotify) this._owner[this._setter](this);
			};
		}, Base.each(['Point', 'Size', 'Center', 'Left', 'Top', 'Right', 'Bottom', 'CenterX', 'CenterY', 'TopLeft', 'TopRight', 'BottomLeft', 'BottomRight', 'LeftCenter', 'TopCenter', 'RightCenter', 'BottomCenter'], function (key) {
			var name = 'set' + key;
			this[name] = function () {
				this._dontNotify = true;
				proto[name].apply(this, arguments);
				this._dontNotify = false;
				this._owner[this._setter](this);
			};
		}, {
			isSelected: function () {
				return !!(this._owner._selection & 2);
			},

			setSelected: function (selected) {
				var owner = this._owner;
				if (owner.changeSelection) {
					owner.changeSelection(2, selected);
				}
			}
		}));
	}());

	var Matrix = Base.extend({
		_class: 'Matrix',

		initialize: function Matrix(arg, _dontNotify) {
			var count = arguments.length,
			    ok = true;
			if (count >= 6) {
				this._set.apply(this, arguments);
			} else if (count === 1 || count === 2) {
				if (arg instanceof Matrix) {
					this._set(arg._a, arg._b, arg._c, arg._d, arg._tx, arg._ty, _dontNotify);
				} else if (Array.isArray(arg)) {
					this._set.apply(this, _dontNotify ? arg.concat([_dontNotify]) : arg);
				} else {
					ok = false;
				}
			} else if (!count) {
				this.reset();
			} else {
				ok = false;
			}
			if (!ok) {
				throw new Error('Unsupported matrix parameters');
			}
			return this;
		},

		set: '#initialize',

		_set: function (a, b, c, d, tx, ty, _dontNotify) {
			this._a = a;
			this._b = b;
			this._c = c;
			this._d = d;
			this._tx = tx;
			this._ty = ty;
			if (!_dontNotify) this._changed();
			return this;
		},

		_serialize: function (options, dictionary) {
			return Base.serialize(this.getValues(), options, true, dictionary);
		},

		_changed: function () {
			var owner = this._owner;
			if (owner) {
				if (owner._applyMatrix) {
					owner.transform(null, true);
				} else {
					owner._changed(9);
				}
			}
		},

		clone: function () {
			return new Matrix(this._a, this._b, this._c, this._d, this._tx, this._ty);
		},

		equals: function (mx) {
			return mx === this || mx && this._a === mx._a && this._b === mx._b && this._c === mx._c && this._d === mx._d && this._tx === mx._tx && this._ty === mx._ty;
		},

		toString: function () {
			var f = Formatter.instance;
			return '[[' + [f.number(this._a), f.number(this._c), f.number(this._tx)].join(', ') + '], [' + [f.number(this._b), f.number(this._d), f.number(this._ty)].join(', ') + ']]';
		},

		reset: function (_dontNotify) {
			this._a = this._d = 1;
			this._b = this._c = this._tx = this._ty = 0;
			if (!_dontNotify) this._changed();
			return this;
		},

		apply: function (recursively, _setApplyMatrix) {
			var owner = this._owner;
			if (owner) {
				owner.transform(null, true, Base.pick(recursively, true), _setApplyMatrix);
				return this.isIdentity();
			}
			return false;
		},

		translate: function () {
			var point = Point.read(arguments),
			    x = point.x,
			    y = point.y;
			this._tx += x * this._a + y * this._c;
			this._ty += x * this._b + y * this._d;
			this._changed();
			return this;
		},

		scale: function () {
			var scale = Point.read(arguments),
			    center = Point.read(arguments, 0, { readNull: true });
			if (center) this.translate(center);
			this._a *= scale.x;
			this._b *= scale.x;
			this._c *= scale.y;
			this._d *= scale.y;
			if (center) this.translate(center.negate());
			this._changed();
			return this;
		},

		rotate: function (angle) {
			angle *= Math.PI / 180;
			var center = Point.read(arguments, 1),
			    x = center.x,
			    y = center.y,
			    cos = Math.cos(angle),
			    sin = Math.sin(angle),
			    tx = x - x * cos + y * sin,
			    ty = y - x * sin - y * cos,
			    a = this._a,
			    b = this._b,
			    c = this._c,
			    d = this._d;
			this._a = cos * a + sin * c;
			this._b = cos * b + sin * d;
			this._c = -sin * a + cos * c;
			this._d = -sin * b + cos * d;
			this._tx += tx * a + ty * c;
			this._ty += tx * b + ty * d;
			this._changed();
			return this;
		},

		shear: function () {
			var shear = Point.read(arguments),
			    center = Point.read(arguments, 0, { readNull: true });
			if (center) this.translate(center);
			var a = this._a,
			    b = this._b;
			this._a += shear.y * this._c;
			this._b += shear.y * this._d;
			this._c += shear.x * a;
			this._d += shear.x * b;
			if (center) this.translate(center.negate());
			this._changed();
			return this;
		},

		skew: function () {
			var skew = Point.read(arguments),
			    center = Point.read(arguments, 0, { readNull: true }),
			    toRadians = Math.PI / 180,
			    shear = new Point(Math.tan(skew.x * toRadians), Math.tan(skew.y * toRadians));
			return this.shear(shear, center);
		},

		append: function (mx) {
			if (mx) {
				var a1 = this._a,
				    b1 = this._b,
				    c1 = this._c,
				    d1 = this._d,
				    a2 = mx._a,
				    b2 = mx._c,
				    c2 = mx._b,
				    d2 = mx._d,
				    tx2 = mx._tx,
				    ty2 = mx._ty;
				this._a = a2 * a1 + c2 * c1;
				this._c = b2 * a1 + d2 * c1;
				this._b = a2 * b1 + c2 * d1;
				this._d = b2 * b1 + d2 * d1;
				this._tx += tx2 * a1 + ty2 * c1;
				this._ty += tx2 * b1 + ty2 * d1;
				this._changed();
			}
			return this;
		},

		prepend: function (mx) {
			if (mx) {
				var a1 = this._a,
				    b1 = this._b,
				    c1 = this._c,
				    d1 = this._d,
				    tx1 = this._tx,
				    ty1 = this._ty,
				    a2 = mx._a,
				    b2 = mx._c,
				    c2 = mx._b,
				    d2 = mx._d,
				    tx2 = mx._tx,
				    ty2 = mx._ty;
				this._a = a2 * a1 + b2 * b1;
				this._c = a2 * c1 + b2 * d1;
				this._b = c2 * a1 + d2 * b1;
				this._d = c2 * c1 + d2 * d1;
				this._tx = a2 * tx1 + b2 * ty1 + tx2;
				this._ty = c2 * tx1 + d2 * ty1 + ty2;
				this._changed();
			}
			return this;
		},

		appended: function (mx) {
			return this.clone().append(mx);
		},

		prepended: function (mx) {
			return this.clone().prepend(mx);
		},

		invert: function () {
			var a = this._a,
			    b = this._b,
			    c = this._c,
			    d = this._d,
			    tx = this._tx,
			    ty = this._ty,
			    det = a * d - b * c,
			    res = null;
			if (det && !isNaN(det) && isFinite(tx) && isFinite(ty)) {
				this._a = d / det;
				this._b = -b / det;
				this._c = -c / det;
				this._d = a / det;
				this._tx = (c * ty - d * tx) / det;
				this._ty = (b * tx - a * ty) / det;
				res = this;
			}
			return res;
		},

		inverted: function () {
			return this.clone().invert();
		},

		concatenate: '#append',
		preConcatenate: '#prepend',
		chain: '#appended',

		_shiftless: function () {
			return new Matrix(this._a, this._b, this._c, this._d, 0, 0);
		},

		_orNullIfIdentity: function () {
			return this.isIdentity() ? null : this;
		},

		isIdentity: function () {
			return this._a === 1 && this._b === 0 && this._c === 0 && this._d === 1 && this._tx === 0 && this._ty === 0;
		},

		isInvertible: function () {
			var det = this._a * this._d - this._c * this._b;
			return det && !isNaN(det) && isFinite(this._tx) && isFinite(this._ty);
		},

		isSingular: function () {
			return !this.isInvertible();
		},

		transform: function (src, dst, count) {
			return arguments.length < 3 ? this._transformPoint(Point.read(arguments)) : this._transformCoordinates(src, dst, count);
		},

		_transformPoint: function (point, dest, _dontNotify) {
			var x = point.x,
			    y = point.y;
			if (!dest) dest = new Point();
			return dest._set(x * this._a + y * this._c + this._tx, x * this._b + y * this._d + this._ty, _dontNotify);
		},

		_transformCoordinates: function (src, dst, count) {
			for (var i = 0, max = 2 * count; i < max; i += 2) {
				var x = src[i],
				    y = src[i + 1];
				dst[i] = x * this._a + y * this._c + this._tx;
				dst[i + 1] = x * this._b + y * this._d + this._ty;
			}
			return dst;
		},

		_transformCorners: function (rect) {
			var x1 = rect.x,
			    y1 = rect.y,
			    x2 = x1 + rect.width,
			    y2 = y1 + rect.height,
			    coords = [x1, y1, x2, y1, x2, y2, x1, y2];
			return this._transformCoordinates(coords, coords, 4);
		},

		_transformBounds: function (bounds, dest, _dontNotify) {
			var coords = this._transformCorners(bounds),
			    min = coords.slice(0, 2),
			    max = min.slice();
			for (var i = 2; i < 8; i++) {
				var val = coords[i],
				    j = i & 1;
				if (val < min[j]) {
					min[j] = val;
				} else if (val > max[j]) {
					max[j] = val;
				}
			}
			if (!dest) dest = new Rectangle();
			return dest._set(min[0], min[1], max[0] - min[0], max[1] - min[1], _dontNotify);
		},

		inverseTransform: function () {
			return this._inverseTransform(Point.read(arguments));
		},

		_inverseTransform: function (point, dest, _dontNotify) {
			var a = this._a,
			    b = this._b,
			    c = this._c,
			    d = this._d,
			    tx = this._tx,
			    ty = this._ty,
			    det = a * d - b * c,
			    res = null;
			if (det && !isNaN(det) && isFinite(tx) && isFinite(ty)) {
				var x = point.x - this._tx,
				    y = point.y - this._ty;
				if (!dest) dest = new Point();
				res = dest._set((x * d - y * c) / det, (y * a - x * b) / det, _dontNotify);
			}
			return res;
		},

		decompose: function () {
			var a = this._a,
			    b = this._b,
			    c = this._c,
			    d = this._d,
			    det = a * d - b * c,
			    sqrt = Math.sqrt,
			    atan2 = Math.atan2,
			    degrees = 180 / Math.PI,
			    rotate,
			    scale,
			    skew;
			if (a !== 0 || b !== 0) {
				var r = sqrt(a * a + b * b);
				rotate = Math.acos(a / r) * (b > 0 ? 1 : -1);
				scale = [r, det / r];
				skew = [atan2(a * c + b * d, r * r), 0];
			} else if (c !== 0 || d !== 0) {
				var s = sqrt(c * c + d * d);
				rotate = Math.asin(c / s) * (d > 0 ? 1 : -1);
				scale = [det / s, s];
				skew = [0, atan2(a * c + b * d, s * s)];
			} else {
				rotate = 0;
				skew = scale = [0, 0];
			}
			return {
				translation: this.getTranslation(),
				rotation: rotate * degrees,
				scaling: new Point(scale),
				skewing: new Point(skew[0] * degrees, skew[1] * degrees)
			};
		},

		getValues: function () {
			return [this._a, this._b, this._c, this._d, this._tx, this._ty];
		},

		getTranslation: function () {
			return new Point(this._tx, this._ty);
		},

		getScaling: function () {
			return (this.decompose() || {}).scaling;
		},

		getRotation: function () {
			return (this.decompose() || {}).rotation;
		},

		applyToContext: function (ctx) {
			if (!this.isIdentity()) {
				ctx.transform(this._a, this._b, this._c, this._d, this._tx, this._ty);
			}
		}
	}, Base.each(['a', 'b', 'c', 'd', 'tx', 'ty'], function (key) {
		var part = Base.capitalize(key),
		    prop = '_' + key;
		this['get' + part] = function () {
			return this[prop];
		};
		this['set' + part] = function (value) {
			this[prop] = value;
			this._changed();
		};
	}, {}));

	var Line = Base.extend({
		_class: 'Line',

		initialize: function Line(arg0, arg1, arg2, arg3, arg4) {
			var asVector = false;
			if (arguments.length >= 4) {
				this._px = arg0;
				this._py = arg1;
				this._vx = arg2;
				this._vy = arg3;
				asVector = arg4;
			} else {
				this._px = arg0.x;
				this._py = arg0.y;
				this._vx = arg1.x;
				this._vy = arg1.y;
				asVector = arg2;
			}
			if (!asVector) {
				this._vx -= this._px;
				this._vy -= this._py;
			}
		},

		getPoint: function () {
			return new Point(this._px, this._py);
		},

		getVector: function () {
			return new Point(this._vx, this._vy);
		},

		getLength: function () {
			return this.getVector().getLength();
		},

		intersect: function (line, isInfinite) {
			return Line.intersect(this._px, this._py, this._vx, this._vy, line._px, line._py, line._vx, line._vy, true, isInfinite);
		},

		getSide: function (point, isInfinite) {
			return Line.getSide(this._px, this._py, this._vx, this._vy, point.x, point.y, true, isInfinite);
		},

		getDistance: function (point) {
			return Math.abs(Line.getSignedDistance(this._px, this._py, this._vx, this._vy, point.x, point.y, true));
		},

		isCollinear: function (line) {
			return Point.isCollinear(this._vx, this._vy, line._vx, line._vy);
		},

		isOrthogonal: function (line) {
			return Point.isOrthogonal(this._vx, this._vy, line._vx, line._vy);
		},

		statics: {
			intersect: function (p1x, p1y, v1x, v1y, p2x, p2y, v2x, v2y, asVector, isInfinite) {
				if (!asVector) {
					v1x -= p1x;
					v1y -= p1y;
					v2x -= p2x;
					v2y -= p2y;
				}
				var cross = v1x * v2y - v1y * v2x;
				if (!Numerical.isZero(cross)) {
					var dx = p1x - p2x,
					    dy = p1y - p2y,
					    u1 = (v2x * dy - v2y * dx) / cross,
					    u2 = (v1x * dy - v1y * dx) / cross,
					    epsilon = 1e-12,
					    uMin = -epsilon,
					    uMax = 1 + epsilon;
					if (isInfinite || uMin < u1 && u1 < uMax && uMin < u2 && u2 < uMax) {
						if (!isInfinite) {
							u1 = u1 <= 0 ? 0 : u1 >= 1 ? 1 : u1;
						}
						return new Point(p1x + u1 * v1x, p1y + u1 * v1y);
					}
				}
			},

			getSide: function (px, py, vx, vy, x, y, asVector, isInfinite) {
				if (!asVector) {
					vx -= px;
					vy -= py;
				}
				var v2x = x - px,
				    v2y = y - py,
				    ccw = v2x * vy - v2y * vx;
				if (!isInfinite && Numerical.isZero(ccw)) {
					ccw = (v2x * vx + v2x * vx) / (vx * vx + vy * vy);
					if (ccw >= 0 && ccw <= 1) ccw = 0;
				}
				return ccw < 0 ? -1 : ccw > 0 ? 1 : 0;
			},

			getSignedDistance: function (px, py, vx, vy, x, y, asVector) {
				if (!asVector) {
					vx -= px;
					vy -= py;
				}
				return vx === 0 ? vy > 0 ? x - px : px - x : vy === 0 ? vx < 0 ? y - py : py - y : ((x - px) * vy - (y - py) * vx) / Math.sqrt(vx * vx + vy * vy);
			},

			getDistance: function (px, py, vx, vy, x, y, asVector) {
				return Math.abs(Line.getSignedDistance(px, py, vx, vy, x, y, asVector));
			}
		}
	});

	var Project = PaperScopeItem.extend({
		_class: 'Project',
		_list: 'projects',
		_reference: 'project',
		_compactSerialize: true,

		initialize: function Project(element) {
			PaperScopeItem.call(this, true);
			this._children = [];
			this._namedChildren = {};
			this._activeLayer = null;
			this._currentStyle = new Style(null, null, this);
			this._view = View.create(this, element || CanvasProvider.getCanvas(1, 1));
			this._selectionItems = {};
			this._selectionCount = 0;
			this._updateVersion = 0;
		},

		_serialize: function (options, dictionary) {
			return Base.serialize(this._children, options, true, dictionary);
		},

		_changed: function (flags, item) {
			if (flags & 1) {
				var view = this._view;
				if (view) {
					view._needsUpdate = true;
					if (!view._requested && view._autoUpdate) view.requestUpdate();
				}
			}
			var changes = this._changes;
			if (changes && item) {
				var changesById = this._changesById,
				    id = item._id,
				    entry = changesById[id];
				if (entry) {
					entry.flags |= flags;
				} else {
					changes.push(changesById[id] = { item: item, flags: flags });
				}
			}
		},

		clear: function () {
			var children = this._children;
			for (var i = children.length - 1; i >= 0; i--) children[i].remove();
		},

		isEmpty: function () {
			return !this._children.length;
		},

		remove: function remove() {
			if (!remove.base.call(this)) return false;
			if (this._view) this._view.remove();
			return true;
		},

		getView: function () {
			return this._view;
		},

		getCurrentStyle: function () {
			return this._currentStyle;
		},

		setCurrentStyle: function (style) {
			this._currentStyle.set(style);
		},

		getIndex: function () {
			return this._index;
		},

		getOptions: function () {
			return this._scope.settings;
		},

		getLayers: function () {
			return this._children;
		},

		getActiveLayer: function () {
			return this._activeLayer || new Layer({ project: this, insert: true });
		},

		getSymbolDefinitions: function () {
			var definitions = [],
			    ids = {};
			this.getItems({
				class: SymbolItem,
				match: function (item) {
					var definition = item._definition,
					    id = definition._id;
					if (!ids[id]) {
						ids[id] = true;
						definitions.push(definition);
					}
					return false;
				}
			});
			return definitions;
		},

		getSymbols: 'getSymbolDefinitions',

		getSelectedItems: function () {
			var selectionItems = this._selectionItems,
			    items = [];
			for (var id in selectionItems) {
				var item = selectionItems[id],
				    selection = item._selection;
				if (selection & 1 && item.isInserted()) {
					items.push(item);
				} else if (!selection) {
					this._updateSelection(item);
				}
			}
			return items;
		},

		_updateSelection: function (item) {
			var id = item._id,
			    selectionItems = this._selectionItems;
			if (item._selection) {
				if (selectionItems[id] !== item) {
					this._selectionCount++;
					selectionItems[id] = item;
				}
			} else if (selectionItems[id] === item) {
				this._selectionCount--;
				delete selectionItems[id];
			}
		},

		selectAll: function () {
			var children = this._children;
			for (var i = 0, l = children.length; i < l; i++) children[i].setFullySelected(true);
		},

		deselectAll: function () {
			var selectionItems = this._selectionItems;
			for (var i in selectionItems) selectionItems[i].setFullySelected(false);
		},

		addLayer: function (layer) {
			return this.insertLayer(undefined, layer);
		},

		insertLayer: function (index, layer) {
			if (layer instanceof Layer) {
				layer._remove(false, true);
				Base.splice(this._children, [layer], index, 0);
				layer._setProject(this, true);
				var name = layer._name;
				if (name) layer.setName(name);
				if (this._changes) layer._changed(5);
				if (!this._activeLayer) this._activeLayer = layer;
			} else {
				layer = null;
			}
			return layer;
		},

		_insertItem: function (index, item, _created) {
			item = this.insertLayer(index, item) || (this._activeLayer || this._insertItem(undefined, new Layer(Item.NO_INSERT), true)).insertChild(index, item);
			if (_created && item.activate) item.activate();
			return item;
		},

		getItems: function (options) {
			return Item._getItems(this, options);
		},

		getItem: function (options) {
			return Item._getItems(this, options, null, null, true)[0] || null;
		},

		importJSON: function (json) {
			this.activate();
			var layer = this._activeLayer;
			return Base.importJSON(json, layer && layer.isEmpty() && layer);
		},

		removeOn: function (type) {
			var sets = this._removeSets;
			if (sets) {
				if (type === 'mouseup') sets.mousedrag = null;
				var set = sets[type];
				if (set) {
					for (var id in set) {
						var item = set[id];
						for (var key in sets) {
							var other = sets[key];
							if (other && other != set) delete other[item._id];
						}
						item.remove();
					}
					sets[type] = null;
				}
			}
		},

		draw: function (ctx, matrix, pixelRatio) {
			this._updateVersion++;
			ctx.save();
			matrix.applyToContext(ctx);
			var children = this._children,
			    param = new Base({
				offset: new Point(0, 0),
				pixelRatio: pixelRatio,
				viewMatrix: matrix.isIdentity() ? null : matrix,
				matrices: [new Matrix()],
				updateMatrix: true
			});
			for (var i = 0, l = children.length; i < l; i++) {
				children[i].draw(ctx, param);
			}
			ctx.restore();

			if (this._selectionCount > 0) {
				ctx.save();
				ctx.strokeWidth = 1;
				var items = this._selectionItems,
				    size = this._scope.settings.handleSize,
				    version = this._updateVersion;
				for (var id in items) {
					items[id]._drawSelection(ctx, matrix, size, items, version);
				}
				ctx.restore();
			}
		}
	});

	var Item = Base.extend(Emitter, {
		statics: {
			extend: function extend(src) {
				if (src._serializeFields) src._serializeFields = Base.set({}, this.prototype._serializeFields, src._serializeFields);
				return extend.base.apply(this, arguments);
			},

			NO_INSERT: { insert: false }
		},

		_class: 'Item',
		_name: null,
		_applyMatrix: true,
		_canApplyMatrix: true,
		_canScaleStroke: false,
		_pivot: null,
		_visible: true,
		_blendMode: 'normal',
		_opacity: 1,
		_locked: false,
		_guide: false,
		_clipMask: false,
		_selection: 0,
		_selectBounds: true,
		_selectChildren: false,
		_serializeFields: {
			name: null,
			applyMatrix: null,
			matrix: new Matrix(),
			pivot: null,
			visible: true,
			blendMode: 'normal',
			opacity: 1,
			locked: false,
			guide: false,
			clipMask: false,
			selected: false,
			data: {}
		},
		_prioritize: ['applyMatrix']
	}, new function () {
		var handlers = ['onMouseDown', 'onMouseUp', 'onMouseDrag', 'onClick', 'onDoubleClick', 'onMouseMove', 'onMouseEnter', 'onMouseLeave'];
		return Base.each(handlers, function (name) {
			this._events[name] = {
				install: function (type) {
					this.getView()._countItemEvent(type, 1);
				},

				uninstall: function (type) {
					this.getView()._countItemEvent(type, -1);
				}
			};
		}, {
			_events: {
				onFrame: {
					install: function () {
						this.getView()._animateItem(this, true);
					},

					uninstall: function () {
						this.getView()._animateItem(this, false);
					}
				},

				onLoad: {},
				onError: {}
			},
			statics: {
				_itemHandlers: handlers
			}
		});
	}(), {
		initialize: function Item() {},

		_initialize: function (props, point) {
			var hasProps = props && Base.isPlainObject(props),
			    internal = hasProps && props.internal === true,
			    matrix = this._matrix = new Matrix(),
			    project = hasProps && props.project || paper.project,
			    settings = paper.settings;
			this._id = internal ? null : UID.get();
			this._parent = this._index = null;
			this._applyMatrix = this._canApplyMatrix && settings.applyMatrix;
			if (point) matrix.translate(point);
			matrix._owner = this;
			this._style = new Style(project._currentStyle, this, project);
			if (internal || hasProps && props.insert === false || !settings.insertItems && !(hasProps && props.insert === true)) {
				this._setProject(project);
			} else {
				(hasProps && props.parent || project)._insertItem(undefined, this, true);
			}
			if (hasProps && props !== Item.NO_INSERT) {
				this.set(props, {
					internal: true, insert: true, project: true, parent: true
				});
			}
			return hasProps;
		},

		_serialize: function (options, dictionary) {
			var props = {},
			    that = this;

			function serialize(fields) {
				for (var key in fields) {
					var value = that[key];
					if (!Base.equals(value, key === 'leading' ? fields.fontSize * 1.2 : fields[key])) {
						props[key] = Base.serialize(value, options, key !== 'data', dictionary);
					}
				}
			}

			serialize(this._serializeFields);
			if (!(this instanceof Group)) serialize(this._style._defaults);
			return [this._class, props];
		},

		_changed: function (flags) {
			var symbol = this._symbol,
			    cacheParent = this._parent || symbol,
			    project = this._project;
			if (flags & 8) {
				this._bounds = this._position = this._decomposed = this._globalMatrix = undefined;
			}
			if (cacheParent && flags & 40) {
				Item._clearBoundsCache(cacheParent);
			}
			if (flags & 2) {
				Item._clearBoundsCache(this);
			}
			if (project) project._changed(flags, this);
			if (symbol) symbol._changed(flags);
		},

		getId: function () {
			return this._id;
		},

		getName: function () {
			return this._name;
		},

		setName: function (name) {

			if (this._name) this._removeNamed();
			if (name === +name + '') throw new Error('Names consisting only of numbers are not supported.');
			var owner = this._getOwner();
			if (name && owner) {
				var children = owner._children,
				    namedChildren = owner._namedChildren;
				(namedChildren[name] = namedChildren[name] || []).push(this);
				if (!(name in children)) children[name] = this;
			}
			this._name = name || undefined;
			this._changed(128);
		},

		getStyle: function () {
			return this._style;
		},

		setStyle: function (style) {
			this.getStyle().set(style);
		}
	}, Base.each(['locked', 'visible', 'blendMode', 'opacity', 'guide'], function (name) {
		var part = Base.capitalize(name),
		    name = '_' + name;
		this['get' + part] = function () {
			return this[name];
		};
		this['set' + part] = function (value) {
			if (value != this[name]) {
				this[name] = value;
				this._changed(name === '_locked' ? 128 : 129);
			}
		};
	}, {}), {
		beans: true,

		getSelection: function () {
			return this._selection;
		},

		setSelection: function (selection) {
			if (selection !== this._selection) {
				this._selection = selection;
				var project = this._project;
				if (project) {
					project._updateSelection(this);
					this._changed(129);
				}
			}
		},

		changeSelection: function (flag, selected) {
			var selection = this._selection;
			this.setSelection(selected ? selection | flag : selection & ~flag);
		},

		isSelected: function () {
			if (this._selectChildren) {
				var children = this._children;
				for (var i = 0, l = children.length; i < l; i++) if (children[i].isSelected()) return true;
			}
			return !!(this._selection & 1);
		},

		setSelected: function (selected) {
			if (this._selectChildren) {
				var children = this._children;
				for (var i = 0, l = children.length; i < l; i++) children[i].setSelected(selected);
			}
			this.changeSelection(1, selected);
		},

		isFullySelected: function () {
			var children = this._children,
			    selected = !!(this._selection & 1);
			if (children && selected) {
				for (var i = 0, l = children.length; i < l; i++) if (!children[i].isFullySelected()) return false;
				return true;
			}
			return selected;
		},

		setFullySelected: function (selected) {
			var children = this._children;
			if (children) {
				for (var i = 0, l = children.length; i < l; i++) children[i].setFullySelected(selected);
			}
			this.changeSelection(1, selected);
		},

		isClipMask: function () {
			return this._clipMask;
		},

		setClipMask: function (clipMask) {
			if (this._clipMask != (clipMask = !!clipMask)) {
				this._clipMask = clipMask;
				if (clipMask) {
					this.setFillColor(null);
					this.setStrokeColor(null);
				}
				this._changed(129);
				if (this._parent) this._parent._changed(1024);
			}
		},

		getData: function () {
			if (!this._data) this._data = {};
			return this._data;
		},

		setData: function (data) {
			this._data = data;
		},

		getPosition: function (_dontLink) {
			var position = this._position,
			    ctor = _dontLink ? Point : LinkedPoint;
			if (!position) {
				var pivot = this._pivot;
				position = this._position = pivot ? this._matrix._transformPoint(pivot) : this.getBounds().getCenter(true);
			}
			return new ctor(position.x, position.y, this, 'setPosition');
		},

		setPosition: function () {
			this.translate(Point.read(arguments).subtract(this.getPosition(true)));
		},

		getPivot: function () {
			var pivot = this._pivot;
			return pivot ? new LinkedPoint(pivot.x, pivot.y, this, 'setPivot') : null;
		},

		setPivot: function () {
			this._pivot = Point.read(arguments, 0, { clone: true, readNull: true });
			this._position = undefined;
		}
	}, Base.each({
		getStrokeBounds: { stroke: true },
		getHandleBounds: { handle: true },
		getInternalBounds: { internal: true }
	}, function (options, key) {
		this[key] = function (matrix) {
			return this.getBounds(matrix, options);
		};
	}, {
		beans: true,

		getBounds: function (matrix, options) {
			var hasMatrix = options || matrix instanceof Matrix,
			    opts = Base.set({}, hasMatrix ? options : matrix, this._boundsOptions);
			if (!opts.stroke || this.getStrokeScaling()) opts.cacheItem = this;
			var bounds = this._getCachedBounds(hasMatrix && matrix, opts);
			return !arguments.length ? new LinkedRectangle(bounds.x, bounds.y, bounds.width, bounds.height, this, 'setBounds') : bounds;
		},

		setBounds: function () {
			var rect = Rectangle.read(arguments),
			    bounds = this.getBounds(),
			    _matrix = this._matrix,
			    matrix = new Matrix(),
			    center = rect.getCenter();
			matrix.translate(center);
			if (rect.width != bounds.width || rect.height != bounds.height) {
				if (!_matrix.isInvertible()) {
					_matrix.set(_matrix._backup || new Matrix().translate(_matrix.getTranslation()));
					bounds = this.getBounds();
				}
				matrix.scale(bounds.width !== 0 ? rect.width / bounds.width : 0, bounds.height !== 0 ? rect.height / bounds.height : 0);
			}
			center = bounds.getCenter();
			matrix.translate(-center.x, -center.y);
			this.transform(matrix);
		},

		_getBounds: function (matrix, options) {
			var children = this._children;
			if (!children || !children.length) return new Rectangle();
			Item._updateBoundsCache(this, options.cacheItem);
			return Item._getBounds(children, matrix, options);
		},

		_getCachedBounds: function (matrix, options) {
			matrix = matrix && matrix._orNullIfIdentity();
			var internal = options.internal,
			    cacheItem = options.cacheItem,
			    _matrix = internal ? null : this._matrix._orNullIfIdentity(),
			    cacheKey = cacheItem && (!matrix || matrix.equals(_matrix)) && [options.stroke ? 1 : 0, options.handle ? 1 : 0, internal ? 1 : 0].join('');
			Item._updateBoundsCache(this._parent || this._symbol, cacheItem);
			if (cacheKey && this._bounds && cacheKey in this._bounds) return this._bounds[cacheKey].rect.clone();
			var bounds = this._getBounds(matrix || _matrix, options);
			if (cacheKey) {
				if (!this._bounds) this._bounds = {};
				var cached = this._bounds[cacheKey] = {
					rect: bounds.clone(),
					internal: options.internal
				};
			}
			return bounds;
		},

		_getStrokeMatrix: function (matrix, options) {
			var parent = this.getStrokeScaling() ? null : options && options.internal ? this : this._parent || this._symbol && this._symbol._item,
			    mx = parent ? parent.getViewMatrix().invert() : matrix;
			return mx && mx._shiftless();
		},

		statics: {
			_updateBoundsCache: function (parent, item) {
				if (parent && item) {
					var id = item._id,
					    ref = parent._boundsCache = parent._boundsCache || {
						ids: {},
						list: []
					};
					if (!ref.ids[id]) {
						ref.list.push(item);
						ref.ids[id] = item;
					}
				}
			},

			_clearBoundsCache: function (item) {
				var cache = item._boundsCache;
				if (cache) {
					item._bounds = item._position = item._boundsCache = undefined;
					for (var i = 0, list = cache.list, l = list.length; i < l; i++) {
						var other = list[i];
						if (other !== item) {
							other._bounds = other._position = undefined;
							if (other._boundsCache) Item._clearBoundsCache(other);
						}
					}
				}
			},

			_getBounds: function (items, matrix, options) {
				var x1 = Infinity,
				    x2 = -x1,
				    y1 = x1,
				    y2 = x2;
				options = options || {};
				for (var i = 0, l = items.length; i < l; i++) {
					var item = items[i];
					if (item._visible && !item.isEmpty()) {
						var rect = item._getCachedBounds(matrix && matrix.appended(item._matrix), options);
						x1 = Math.min(rect.x, x1);
						y1 = Math.min(rect.y, y1);
						x2 = Math.max(rect.x + rect.width, x2);
						y2 = Math.max(rect.y + rect.height, y2);
					}
				}
				return isFinite(x1) ? new Rectangle(x1, y1, x2 - x1, y2 - y1) : new Rectangle();
			}
		}

	}), {
		beans: true,

		_decompose: function () {
			return this._applyMatrix ? null : this._decomposed || (this._decomposed = this._matrix.decompose());
		},

		getRotation: function () {
			var decomposed = this._decompose();
			return decomposed ? decomposed.rotation : 0;
		},

		setRotation: function (rotation) {
			var current = this.getRotation();
			if (current != null && rotation != null) {
				var decomposed = this._decomposed;
				this.rotate(rotation - current);
				if (decomposed) {
					decomposed.rotation = rotation;
					this._decomposed = decomposed;
				}
			}
		},

		getScaling: function () {
			var decomposed = this._decompose(),
			    s = decomposed && decomposed.scaling;
			return new LinkedPoint(s ? s.x : 1, s ? s.y : 1, this, 'setScaling');
		},

		setScaling: function () {
			var current = this.getScaling(),
			    scaling = Point.read(arguments, 0, { clone: true, readNull: true });
			if (current && scaling && !current.equals(scaling)) {
				var decomposed = this._decomposed;
				this.scale(scaling.x / current.x, scaling.y / current.y);
				if (decomposed) {
					decomposed.scaling = scaling;
					this._decomposed = decomposed;
				}
			}
		},

		getMatrix: function () {
			return this._matrix;
		},

		setMatrix: function () {
			var matrix = this._matrix;
			matrix.initialize.apply(matrix, arguments);
		},

		getGlobalMatrix: function (_dontClone) {
			var matrix = this._globalMatrix,
			    updateVersion = this._project._updateVersion;
			if (matrix && matrix._updateVersion !== updateVersion) matrix = null;
			if (!matrix) {
				matrix = this._globalMatrix = this._matrix.clone();
				var parent = this._parent;
				if (parent) matrix.prepend(parent.getGlobalMatrix(true));
				matrix._updateVersion = updateVersion;
			}
			return _dontClone ? matrix : matrix.clone();
		},

		getViewMatrix: function () {
			return this.getGlobalMatrix().prepend(this.getView()._matrix);
		},

		getApplyMatrix: function () {
			return this._applyMatrix;
		},

		setApplyMatrix: function (apply) {
			if (this._applyMatrix = this._canApplyMatrix && !!apply) this.transform(null, true);
		},

		getTransformContent: '#getApplyMatrix',
		setTransformContent: '#setApplyMatrix'
	}, {
		getProject: function () {
			return this._project;
		},

		_setProject: function (project, installEvents) {
			if (this._project !== project) {
				if (this._project) this._installEvents(false);
				this._project = project;
				var children = this._children;
				for (var i = 0, l = children && children.length; i < l; i++) children[i]._setProject(project);
				installEvents = true;
			}
			if (installEvents) this._installEvents(true);
		},

		getView: function () {
			return this._project._view;
		},

		_installEvents: function _installEvents(install) {
			_installEvents.base.call(this, install);
			var children = this._children;
			for (var i = 0, l = children && children.length; i < l; i++) children[i]._installEvents(install);
		},

		getLayer: function () {
			var parent = this;
			while (parent = parent._parent) {
				if (parent instanceof Layer) return parent;
			}
			return null;
		},

		getParent: function () {
			return this._parent;
		},

		setParent: function (item) {
			return item.addChild(this);
		},

		_getOwner: '#getParent',

		getChildren: function () {
			return this._children;
		},

		setChildren: function (items) {
			this.removeChildren();
			this.addChildren(items);
		},

		getFirstChild: function () {
			return this._children && this._children[0] || null;
		},

		getLastChild: function () {
			return this._children && this._children[this._children.length - 1] || null;
		},

		getNextSibling: function () {
			var owner = this._getOwner();
			return owner && owner._children[this._index + 1] || null;
		},

		getPreviousSibling: function () {
			var owner = this._getOwner();
			return owner && owner._children[this._index - 1] || null;
		},

		getIndex: function () {
			return this._index;
		},

		equals: function (item) {
			return item === this || item && this._class === item._class && this._style.equals(item._style) && this._matrix.equals(item._matrix) && this._locked === item._locked && this._visible === item._visible && this._blendMode === item._blendMode && this._opacity === item._opacity && this._clipMask === item._clipMask && this._guide === item._guide && this._equals(item) || false;
		},

		_equals: function (item) {
			return Base.equals(this._children, item._children);
		},

		clone: function (options) {
			var copy = new this.constructor(Item.NO_INSERT),
			    children = this._children,
			    insert = Base.pick(options ? options.insert : undefined, options === undefined || options === true),
			    deep = Base.pick(options ? options.deep : undefined, true);
			if (children) copy.copyAttributes(this);
			if (!children || deep) copy.copyContent(this);
			if (!children) copy.copyAttributes(this);
			if (insert) copy.insertAbove(this);
			var name = this._name,
			    parent = this._parent;
			if (name && parent) {
				var children = parent._children,
				    orig = name,
				    i = 1;
				while (children[name]) name = orig + ' ' + i++;
				if (name !== orig) copy.setName(name);
			}
			return copy;
		},

		copyContent: function (source) {
			var children = source._children;
			for (var i = 0, l = children && children.length; i < l; i++) {
				this.addChild(children[i].clone(false), true);
			}
		},

		copyAttributes: function (source, excludeMatrix) {
			this.setStyle(source._style);
			var keys = ['_locked', '_visible', '_blendMode', '_opacity', '_clipMask', '_guide'];
			for (var i = 0, l = keys.length; i < l; i++) {
				var key = keys[i];
				if (source.hasOwnProperty(key)) this[key] = source[key];
			}
			if (!excludeMatrix) this._matrix.set(source._matrix, true);
			this.setApplyMatrix(source._applyMatrix);
			this.setPivot(source._pivot);
			this.setSelection(source._selection);
			var data = source._data,
			    name = source._name;
			this._data = data ? Base.clone(data) : null;
			if (name) this.setName(name);
		},

		rasterize: function (resolution, insert) {
			var bounds = this.getStrokeBounds(),
			    scale = (resolution || this.getView().getResolution()) / 72,
			    topLeft = bounds.getTopLeft().floor(),
			    bottomRight = bounds.getBottomRight().ceil(),
			    size = new Size(bottomRight.subtract(topLeft)),
			    raster = new Raster(Item.NO_INSERT);
			if (!size.isZero()) {
				var canvas = CanvasProvider.getCanvas(size.multiply(scale)),
				    ctx = canvas.getContext('2d'),
				    matrix = new Matrix().scale(scale).translate(topLeft.negate());
				ctx.save();
				matrix.applyToContext(ctx);
				this.draw(ctx, new Base({ matrices: [matrix] }));
				ctx.restore();
				raster.setCanvas(canvas);
			}
			raster.transform(new Matrix().translate(topLeft.add(size.divide(2))).scale(1 / scale));
			if (insert === undefined || insert) raster.insertAbove(this);
			return raster;
		},

		contains: function () {
			return !!this._contains(this._matrix._inverseTransform(Point.read(arguments)));
		},

		_contains: function (point) {
			var children = this._children;
			if (children) {
				for (var i = children.length - 1; i >= 0; i--) {
					if (children[i].contains(point)) return true;
				}
				return false;
			}
			return point.isInside(this.getInternalBounds());
		},

		isInside: function () {
			return Rectangle.read(arguments).contains(this.getBounds());
		},

		_asPathItem: function () {
			return new Path.Rectangle({
				rectangle: this.getInternalBounds(),
				matrix: this._matrix,
				insert: false
			});
		},

		intersects: function (item, _matrix) {
			if (!(item instanceof Item)) return false;
			return this._asPathItem().getIntersections(item._asPathItem(), null, _matrix, true).length > 0;
		}
	}, new function () {
		function hitTest() {
			return this._hitTest(Point.read(arguments), HitResult.getOptions(arguments));
		}

		function hitTestAll() {
			var point = Point.read(arguments),
			    options = HitResult.getOptions(arguments),
			    all = [];
			this._hitTest(point, Base.set({ all: all }, options));
			return all;
		}

		function hitTestChildren(point, options, viewMatrix, _exclude) {
			var children = this._children;
			if (children) {
				for (var i = children.length - 1; i >= 0; i--) {
					var child = children[i];
					var res = child !== _exclude && child._hitTest(point, options, viewMatrix);
					if (res && !options.all) return res;
				}
			}
			return null;
		}

		Project.inject({
			hitTest: hitTest,
			hitTestAll: hitTestAll,
			_hitTest: hitTestChildren
		});

		return {
			hitTest: hitTest,
			hitTestAll: hitTestAll,
			_hitTestChildren: hitTestChildren
		};
	}(), {

		_hitTest: function (point, options, parentViewMatrix) {
			if (this._locked || !this._visible || this._guide && !options.guides || this.isEmpty()) {
				return null;
			}

			var matrix = this._matrix,
			    viewMatrix = parentViewMatrix ? parentViewMatrix.appended(matrix) : this.getGlobalMatrix().prepend(this.getView()._matrix),
			    tolerance = Math.max(options.tolerance, 1e-12),
			    tolerancePadding = options._tolerancePadding = new Size(Path._getStrokePadding(tolerance, matrix.inverted()._shiftless()));
			point = matrix._inverseTransform(point);
			if (!point || !this._children && !this.getBounds({ internal: true, stroke: true, handle: true }).expand(tolerancePadding.multiply(2))._containsPoint(point)) {
				return null;
			}

			var checkSelf = !(options.guides && !this._guide || options.selected && !this.isSelected() || options.type && options.type !== Base.hyphenate(this._class) || options.class && !(this instanceof options.class)),
			    match = options.match,
			    that = this,
			    bounds,
			    res;

			function filter(hit) {
				if (hit && match && !match(hit)) hit = null;
				if (hit && options.all) options.all.push(hit);
				return hit;
			}

			function checkBounds(type, part) {
				var pt = bounds['get' + part]();
				if (point.subtract(pt).divide(tolerancePadding).length <= 1) {
					return new HitResult(type, that, { name: Base.hyphenate(part), point: pt });
				}
			}

			if (checkSelf && (options.center || options.bounds) && this._parent) {
				bounds = this.getInternalBounds();
				if (options.center) {
					res = checkBounds('center', 'Center');
				}
				if (!res && options.bounds) {
					var points = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight', 'LeftCenter', 'TopCenter', 'RightCenter', 'BottomCenter'];
					for (var i = 0; i < 8 && !res; i++) {
						res = checkBounds('bounds', points[i]);
					}
				}
				res = filter(res);
			}

			if (!res) {
				res = this._hitTestChildren(point, options, viewMatrix) || checkSelf && filter(this._hitTestSelf(point, options, viewMatrix, this.getStrokeScaling() ? null : viewMatrix.inverted()._shiftless())) || null;
			}
			if (res && res.point) {
				res.point = matrix.transform(res.point);
			}
			return res;
		},

		_hitTestSelf: function (point, options) {
			if (options.fill && this.hasFill() && this._contains(point)) return new HitResult('fill', this);
		},

		matches: function (name, compare) {
			function matchObject(obj1, obj2) {
				for (var i in obj1) {
					if (obj1.hasOwnProperty(i)) {
						var val1 = obj1[i],
						    val2 = obj2[i];
						if (Base.isPlainObject(val1) && Base.isPlainObject(val2)) {
							if (!matchObject(val1, val2)) return false;
						} else if (!Base.equals(val1, val2)) {
							return false;
						}
					}
				}
				return true;
			}
			var type = typeof name;
			if (type === 'object') {
				for (var key in name) {
					if (name.hasOwnProperty(key) && !this.matches(key, name[key])) return false;
				}
				return true;
			} else if (type === 'function') {
				return name(this);
			} else if (name === 'match') {
				return compare(this);
			} else {
				var value = /^(empty|editable)$/.test(name) ? this['is' + Base.capitalize(name)]() : name === 'type' ? Base.hyphenate(this._class) : this[name];
				if (name === 'class') {
					if (typeof compare === 'function') return this instanceof compare;
					value = this._class;
				}
				if (typeof compare === 'function') {
					return !!compare(value);
				} else if (compare) {
					if (compare.test) {
						return compare.test(value);
					} else if (Base.isPlainObject(compare)) {
						return matchObject(compare, value);
					}
				}
				return Base.equals(value, compare);
			}
		},

		getItems: function (options) {
			return Item._getItems(this, options, this._matrix);
		},

		getItem: function (options) {
			return Item._getItems(this, options, this._matrix, null, true)[0] || null;
		},

		statics: {
			_getItems: function _getItems(item, options, matrix, param, firstOnly) {
				if (!param) {
					var obj = typeof options === 'object' && options,
					    overlapping = obj && obj.overlapping,
					    inside = obj && obj.inside,
					    bounds = overlapping || inside,
					    rect = bounds && Rectangle.read([bounds]);
					param = {
						items: [],
						recursive: obj && obj.recursive !== false,
						inside: !!inside,
						overlapping: !!overlapping,
						rect: rect,
						path: overlapping && new Path.Rectangle({
							rectangle: rect,
							insert: false
						})
					};
					if (obj) {
						options = Base.filter({}, options, {
							recursive: true, inside: true, overlapping: true
						});
					}
				}
				var children = item._children,
				    items = param.items,
				    rect = param.rect;
				matrix = rect && (matrix || new Matrix());
				for (var i = 0, l = children && children.length; i < l; i++) {
					var child = children[i],
					    childMatrix = matrix && matrix.appended(child._matrix),
					    add = true;
					if (rect) {
						var bounds = child.getBounds(childMatrix);
						if (!rect.intersects(bounds)) continue;
						if (!(rect.contains(bounds) || param.overlapping && (bounds.contains(rect) || param.path.intersects(child, childMatrix)))) add = false;
					}
					if (add && child.matches(options)) {
						items.push(child);
						if (firstOnly) break;
					}
					if (param.recursive !== false) {
						_getItems(child, options, childMatrix, param, firstOnly);
					}
					if (firstOnly && items.length > 0) break;
				}
				return items;
			}
		}
	}, {

		importJSON: function (json) {
			var res = Base.importJSON(json, this);
			return res !== this ? this.addChild(res) : res;
		},

		addChild: function (item) {
			return this.insertChild(undefined, item);
		},

		insertChild: function (index, item) {
			var res = item ? this.insertChildren(index, [item]) : null;
			return res && res[0];
		},

		addChildren: function (items) {
			return this.insertChildren(this._children.length, items);
		},

		insertChildren: function (index, items) {
			var children = this._children;
			if (children && items && items.length > 0) {
				items = Base.slice(items);
				for (var i = items.length - 1; i >= 0; i--) {
					var item = items[i];
					if (!item) {
						items.splice(i, 1);
					} else {
						item._remove(false, true);
					}
				}
				Base.splice(children, items, index, 0);
				var project = this._project,
				    notifySelf = project._changes;
				for (var i = 0, l = items.length; i < l; i++) {
					var item = items[i],
					    name = item._name;
					item._parent = this;
					item._setProject(project, true);
					if (name) item.setName(name);
					if (notifySelf) this._changed(5);
				}
				this._changed(11);
			} else {
				items = null;
			}
			return items;
		},

		_insertItem: '#insertChild',

		_insertAt: function (item, offset) {
			var owner = item && item._getOwner(),
			    res = item !== this && owner ? this : null;
			if (res) {
				res._remove(false, true);
				owner._insertItem(item._index + offset, res);
			}
			return res;
		},

		insertAbove: function (item) {
			return this._insertAt(item, 1);
		},

		insertBelow: function (item) {
			return this._insertAt(item, 0);
		},

		sendToBack: function () {
			var owner = this._getOwner();
			return owner ? owner._insertItem(0, this) : null;
		},

		bringToFront: function () {
			var owner = this._getOwner();
			return owner ? owner._insertItem(undefined, this) : null;
		},

		appendTop: '#addChild',

		appendBottom: function (item) {
			return this.insertChild(0, item);
		},

		moveAbove: '#insertAbove',

		moveBelow: '#insertBelow',

		copyTo: function (owner) {
			return owner._insertItem(undefined, this.clone(false));
		},

		reduce: function (options) {
			var children = this._children;
			if (children && children.length === 1) {
				var child = children[0].reduce(options);
				if (this._parent) {
					child.insertAbove(this);
					this.remove();
				} else {
					child.remove();
				}
				return child;
			}
			return this;
		},

		_removeNamed: function () {
			var owner = this._getOwner();
			if (owner) {
				var children = owner._children,
				    namedChildren = owner._namedChildren,
				    name = this._name,
				    namedArray = namedChildren[name],
				    index = namedArray ? namedArray.indexOf(this) : -1;
				if (index !== -1) {
					if (children[name] == this) delete children[name];
					namedArray.splice(index, 1);
					if (namedArray.length) {
						children[name] = namedArray[0];
					} else {
						delete namedChildren[name];
					}
				}
			}
		},

		_remove: function (notifySelf, notifyParent) {
			var owner = this._getOwner(),
			    project = this._project,
			    index = this._index;
			if (owner) {
				if (this._name) this._removeNamed();
				if (index != null) {
					if (project._activeLayer === this) project._activeLayer = this.getNextSibling() || this.getPreviousSibling();
					Base.splice(owner._children, null, index, 1);
				}
				this._installEvents(false);
				if (notifySelf && project._changes) this._changed(5);
				if (notifyParent) owner._changed(11, this);
				this._parent = null;
				return true;
			}
			return false;
		},

		remove: function () {
			return this._remove(true, true);
		},

		replaceWith: function (item) {
			var ok = item && item.insertBelow(this);
			if (ok) this.remove();
			return ok;
		},

		removeChildren: function (start, end) {
			if (!this._children) return null;
			start = start || 0;
			end = Base.pick(end, this._children.length);
			var removed = Base.splice(this._children, null, start, end - start);
			for (var i = removed.length - 1; i >= 0; i--) {
				removed[i]._remove(true, false);
			}
			if (removed.length > 0) this._changed(11);
			return removed;
		},

		clear: '#removeChildren',

		reverseChildren: function () {
			if (this._children) {
				this._children.reverse();
				for (var i = 0, l = this._children.length; i < l; i++) this._children[i]._index = i;
				this._changed(11);
			}
		},

		isEmpty: function () {
			var children = this._children;
			return !children || !children.length;
		},

		isEditable: function () {
			var item = this;
			while (item) {
				if (!item._visible || item._locked) return false;
				item = item._parent;
			}
			return true;
		},

		hasFill: function () {
			return this.getStyle().hasFill();
		},

		hasStroke: function () {
			return this.getStyle().hasStroke();
		},

		hasShadow: function () {
			return this.getStyle().hasShadow();
		},

		_getOrder: function (item) {
			function getList(item) {
				var list = [];
				do {
					list.unshift(item);
				} while (item = item._parent);
				return list;
			}
			var list1 = getList(this),
			    list2 = getList(item);
			for (var i = 0, l = Math.min(list1.length, list2.length); i < l; i++) {
				if (list1[i] != list2[i]) {
					return list1[i]._index < list2[i]._index ? 1 : -1;
				}
			}
			return 0;
		},

		hasChildren: function () {
			return this._children && this._children.length > 0;
		},

		isInserted: function () {
			return this._parent ? this._parent.isInserted() : false;
		},

		isAbove: function (item) {
			return this._getOrder(item) === -1;
		},

		isBelow: function (item) {
			return this._getOrder(item) === 1;
		},

		isParent: function (item) {
			return this._parent === item;
		},

		isChild: function (item) {
			return item && item._parent === this;
		},

		isDescendant: function (item) {
			var parent = this;
			while (parent = parent._parent) {
				if (parent === item) return true;
			}
			return false;
		},

		isAncestor: function (item) {
			return item ? item.isDescendant(this) : false;
		},

		isSibling: function (item) {
			return this._parent === item._parent;
		},

		isGroupedWith: function (item) {
			var parent = this._parent;
			while (parent) {
				if (parent._parent && /^(Group|Layer|CompoundPath)$/.test(parent._class) && item.isDescendant(parent)) return true;
				parent = parent._parent;
			}
			return false;
		}

	}, Base.each(['rotate', 'scale', 'shear', 'skew'], function (key) {
		var rotate = key === 'rotate';
		this[key] = function () {
			var value = (rotate ? Base : Point).read(arguments),
			    center = Point.read(arguments, 0, { readNull: true });
			return this.transform(new Matrix()[key](value, center || this.getPosition(true)));
		};
	}, {
		translate: function () {
			var mx = new Matrix();
			return this.transform(mx.translate.apply(mx, arguments));
		},

		transform: function (matrix, _applyMatrix, _applyRecursively, _setApplyMatrix) {
			if (matrix && matrix.isIdentity()) matrix = null;
			var _matrix = this._matrix,
			    applyMatrix = (_applyMatrix || this._applyMatrix) && (!_matrix.isIdentity() || matrix || _applyMatrix && _applyRecursively && this._children);
			if (!matrix && !applyMatrix) return this;
			if (matrix) {
				if (!matrix.isInvertible() && _matrix.isInvertible()) _matrix._backup = _matrix.getValues();
				_matrix.prepend(matrix);
			}
			if (applyMatrix = applyMatrix && this._transformContent(_matrix, _applyRecursively, _setApplyMatrix)) {
				var pivot = this._pivot,
				    style = this._style,
				    fillColor = style.getFillColor(true),
				    strokeColor = style.getStrokeColor(true);
				if (pivot) _matrix._transformPoint(pivot, pivot, true);
				if (fillColor) fillColor.transform(_matrix);
				if (strokeColor) strokeColor.transform(_matrix);
				_matrix.reset(true);
				if (_setApplyMatrix && this._canApplyMatrix) this._applyMatrix = true;
			}
			var bounds = this._bounds,
			    position = this._position;
			this._changed(9);
			var decomp = bounds && matrix && matrix.decompose();
			if (decomp && !decomp.shearing && decomp.rotation % 90 === 0) {
				for (var key in bounds) {
					var cache = bounds[key];
					if (applyMatrix || !cache.internal) {
						var rect = cache.rect;
						matrix._transformBounds(rect, rect);
					}
				}
				var getter = this._boundsGetter,
				    rect = bounds[getter && getter.getBounds || getter || 'getBounds'];
				if (rect) this._position = rect.getCenter(true);
				this._bounds = bounds;
			} else if (matrix && position) {
				this._position = matrix._transformPoint(position, position);
			}
			return this;
		},

		_transformContent: function (matrix, applyRecursively, setApplyMatrix) {
			var children = this._children;
			if (children) {
				for (var i = 0, l = children.length; i < l; i++) children[i].transform(matrix, true, applyRecursively, setApplyMatrix);
				return true;
			}
		},

		globalToLocal: function () {
			return this.getGlobalMatrix(true)._inverseTransform(Point.read(arguments));
		},

		localToGlobal: function () {
			return this.getGlobalMatrix(true)._transformPoint(Point.read(arguments));
		},

		parentToLocal: function () {
			return this._matrix._inverseTransform(Point.read(arguments));
		},

		localToParent: function () {
			return this._matrix._transformPoint(Point.read(arguments));
		},

		fitBounds: function (rectangle, fill) {
			rectangle = Rectangle.read(arguments);
			var bounds = this.getBounds(),
			    itemRatio = bounds.height / bounds.width,
			    rectRatio = rectangle.height / rectangle.width,
			    scale = (fill ? itemRatio > rectRatio : itemRatio < rectRatio) ? rectangle.width / bounds.width : rectangle.height / bounds.height,
			    newBounds = new Rectangle(new Point(), new Size(bounds.width * scale, bounds.height * scale));
			newBounds.setCenter(rectangle.getCenter());
			this.setBounds(newBounds);
		}
	}), {

		_setStyles: function (ctx, param, viewMatrix) {
			var style = this._style;
			if (style.hasFill()) {
				ctx.fillStyle = style.getFillColor().toCanvasStyle(ctx);
			}
			if (style.hasStroke()) {
				ctx.strokeStyle = style.getStrokeColor().toCanvasStyle(ctx);
				ctx.lineWidth = style.getStrokeWidth();
				var strokeJoin = style.getStrokeJoin(),
				    strokeCap = style.getStrokeCap(),
				    miterLimit = style.getMiterLimit();
				if (strokeJoin) ctx.lineJoin = strokeJoin;
				if (strokeCap) ctx.lineCap = strokeCap;
				if (miterLimit) ctx.miterLimit = miterLimit;
				if (paper.support.nativeDash) {
					var dashArray = style.getDashArray(),
					    dashOffset = style.getDashOffset();
					if (dashArray && dashArray.length) {
						if ('setLineDash' in ctx) {
							ctx.setLineDash(dashArray);
							ctx.lineDashOffset = dashOffset;
						} else {
							ctx.mozDash = dashArray;
							ctx.mozDashOffset = dashOffset;
						}
					}
				}
			}
			if (style.hasShadow()) {
				var pixelRatio = param.pixelRatio || 1,
				    mx = viewMatrix._shiftless().prepend(new Matrix().scale(pixelRatio, pixelRatio)),
				    blur = mx.transform(new Point(style.getShadowBlur(), 0)),
				    offset = mx.transform(this.getShadowOffset());
				ctx.shadowColor = style.getShadowColor().toCanvasStyle(ctx);
				ctx.shadowBlur = blur.getLength();
				ctx.shadowOffsetX = offset.x;
				ctx.shadowOffsetY = offset.y;
			}
		},

		draw: function (ctx, param, parentStrokeMatrix) {
			var updateVersion = this._updateVersion = this._project._updateVersion;
			if (!this._visible || this._opacity === 0) return;
			var matrices = param.matrices,
			    viewMatrix = param.viewMatrix,
			    matrix = this._matrix,
			    globalMatrix = matrices[matrices.length - 1].appended(matrix);
			if (!globalMatrix.isInvertible()) return;

			viewMatrix = viewMatrix ? viewMatrix.appended(globalMatrix) : globalMatrix;

			matrices.push(globalMatrix);
			if (param.updateMatrix) {
				globalMatrix._updateVersion = updateVersion;
				this._globalMatrix = globalMatrix;
			}

			var blendMode = this._blendMode,
			    opacity = this._opacity,
			    normalBlend = blendMode === 'normal',
			    nativeBlend = BlendMode.nativeModes[blendMode],
			    direct = normalBlend && opacity === 1 || param.dontStart || param.clip || (nativeBlend || normalBlend && opacity < 1) && this._canComposite(),
			    pixelRatio = param.pixelRatio || 1,
			    mainCtx,
			    itemOffset,
			    prevOffset;
			if (!direct) {
				var bounds = this.getStrokeBounds(viewMatrix);
				if (!bounds.width || !bounds.height) return;
				prevOffset = param.offset;
				itemOffset = param.offset = bounds.getTopLeft().floor();
				mainCtx = ctx;
				ctx = CanvasProvider.getContext(bounds.getSize().ceil().add(1).multiply(pixelRatio));
				if (pixelRatio !== 1) ctx.scale(pixelRatio, pixelRatio);
			}
			ctx.save();
			var strokeMatrix = parentStrokeMatrix ? parentStrokeMatrix.appended(matrix) : this._canScaleStroke && !this.getStrokeScaling(true) && viewMatrix,
			    clip = !direct && param.clipItem,
			    transform = !strokeMatrix || clip;
			if (direct) {
				ctx.globalAlpha = opacity;
				if (nativeBlend) ctx.globalCompositeOperation = blendMode;
			} else if (transform) {
				ctx.translate(-itemOffset.x, -itemOffset.y);
			}
			if (transform) {
				(direct ? matrix : viewMatrix).applyToContext(ctx);
			}
			if (clip) {
				param.clipItem.draw(ctx, param.extend({ clip: true }));
			}
			if (strokeMatrix) {
				ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
				var offset = param.offset;
				if (offset) ctx.translate(-offset.x, -offset.y);
			}
			this._draw(ctx, param, viewMatrix, strokeMatrix);
			ctx.restore();
			matrices.pop();
			if (param.clip && !param.dontFinish) ctx.clip();
			if (!direct) {
				BlendMode.process(blendMode, ctx, mainCtx, opacity, itemOffset.subtract(prevOffset).multiply(pixelRatio));
				CanvasProvider.release(ctx);
				param.offset = prevOffset;
			}
		},

		_isUpdated: function (updateVersion) {
			var parent = this._parent;
			if (parent instanceof CompoundPath) return parent._isUpdated(updateVersion);
			var updated = this._updateVersion === updateVersion;
			if (!updated && parent && parent._visible && parent._isUpdated(updateVersion)) {
				this._updateVersion = updateVersion;
				updated = true;
			}
			return updated;
		},

		_drawSelection: function (ctx, matrix, size, selectionItems, updateVersion) {
			var selection = this._selection,
			    itemSelected = selection & 1,
			    boundsSelected = selection & 2 || itemSelected && this._selectBounds,
			    positionSelected = selection & 4;
			if (!this._drawSelected) itemSelected = false;
			if ((itemSelected || boundsSelected || positionSelected) && this._isUpdated(updateVersion)) {
				var layer,
				    color = this.getSelectedColor(true) || (layer = this.getLayer()) && layer.getSelectedColor(true),
				    mx = matrix.appended(this.getGlobalMatrix(true)),
				    half = size / 2;
				ctx.strokeStyle = ctx.fillStyle = color ? color.toCanvasStyle(ctx) : '#009dec';
				if (itemSelected) this._drawSelected(ctx, mx, selectionItems);
				if (positionSelected) {
					var point = this.getPosition(true),
					    x = point.x,
					    y = point.y;
					ctx.beginPath();
					ctx.arc(x, y, half, 0, Math.PI * 2, true);
					ctx.stroke();
					var deltas = [[0, -1], [1, 0], [0, 1], [-1, 0]],
					    start = half,
					    end = size + 1;
					for (var i = 0; i < 4; i++) {
						var delta = deltas[i],
						    dx = delta[0],
						    dy = delta[1];
						ctx.moveTo(x + dx * start, y + dy * start);
						ctx.lineTo(x + dx * end, y + dy * end);
						ctx.stroke();
					}
				}
				if (boundsSelected) {
					var coords = mx._transformCorners(this.getInternalBounds());
					ctx.beginPath();
					for (var i = 0; i < 8; i++) {
						ctx[!i ? 'moveTo' : 'lineTo'](coords[i], coords[++i]);
					}
					ctx.closePath();
					ctx.stroke();
					for (var i = 0; i < 8; i++) {
						ctx.fillRect(coords[i] - half, coords[++i] - half, size, size);
					}
				}
			}
		},

		_canComposite: function () {
			return false;
		}
	}, Base.each(['down', 'drag', 'up', 'move'], function (key) {
		this['removeOn' + Base.capitalize(key)] = function () {
			var hash = {};
			hash[key] = true;
			return this.removeOn(hash);
		};
	}, {

		removeOn: function (obj) {
			for (var name in obj) {
				if (obj[name]) {
					var key = 'mouse' + name,
					    project = this._project,
					    sets = project._removeSets = project._removeSets || {};
					sets[key] = sets[key] || {};
					sets[key][this._id] = this;
				}
			}
			return this;
		}
	}));

	var Group = Item.extend({
		_class: 'Group',
		_selectBounds: false,
		_selectChildren: true,
		_serializeFields: {
			children: []
		},

		initialize: function Group(arg) {
			this._children = [];
			this._namedChildren = {};
			if (!this._initialize(arg)) this.addChildren(Array.isArray(arg) ? arg : arguments);
		},

		_changed: function _changed(flags) {
			_changed.base.call(this, flags);
			if (flags & 1026) {
				this._clipItem = undefined;
			}
		},

		_getClipItem: function () {
			var clipItem = this._clipItem;
			if (clipItem === undefined) {
				clipItem = null;
				var children = this._children;
				for (var i = 0, l = children.length; i < l; i++) {
					if (children[i]._clipMask) {
						clipItem = children[i];
						break;
					}
				}
				this._clipItem = clipItem;
			}
			return clipItem;
		},

		isClipped: function () {
			return !!this._getClipItem();
		},

		setClipped: function (clipped) {
			var child = this.getFirstChild();
			if (child) child.setClipMask(clipped);
		},

		_getBounds: function _getBounds(matrix, options) {
			var clipItem = this._getClipItem();
			return clipItem ? clipItem._getCachedBounds(matrix && matrix.appended(clipItem._matrix), Base.set({}, options, { stroke: false })) : _getBounds.base.call(this, matrix, options);
		},

		_hitTestChildren: function _hitTestChildren(point, options, viewMatrix) {
			var clipItem = this._getClipItem();
			return (!clipItem || clipItem.contains(point)) && _hitTestChildren.base.call(this, point, options, viewMatrix, clipItem);
		},

		_draw: function (ctx, param) {
			var clip = param.clip,
			    clipItem = !clip && this._getClipItem();
			param = param.extend({ clipItem: clipItem, clip: false });
			if (clip) {
				ctx.beginPath();
				param.dontStart = param.dontFinish = true;
			} else if (clipItem) {
				clipItem.draw(ctx, param.extend({ clip: true }));
			}
			var children = this._children;
			for (var i = 0, l = children.length; i < l; i++) {
				var item = children[i];
				if (item !== clipItem) item.draw(ctx, param);
			}
		}
	});

	var Layer = Group.extend({
		_class: 'Layer',

		initialize: function Layer() {
			Group.apply(this, arguments);
		},

		_getOwner: function () {
			return this._parent || this._index != null && this._project;
		},

		isInserted: function isInserted() {
			return this._parent ? isInserted.base.call(this) : this._index != null;
		},

		activate: function () {
			this._project._activeLayer = this;
		},

		_hitTestSelf: function () {}
	});

	var Shape = Item.extend({
		_class: 'Shape',
		_applyMatrix: false,
		_canApplyMatrix: false,
		_canScaleStroke: true,
		_serializeFields: {
			type: null,
			size: null,
			radius: null
		},

		initialize: function Shape(props) {
			this._initialize(props);
		},

		_equals: function (item) {
			return this._type === item._type && this._size.equals(item._size) && Base.equals(this._radius, item._radius);
		},

		copyContent: function (source) {
			this.setType(source._type);
			this.setSize(source._size);
			this.setRadius(source._radius);
		},

		getType: function () {
			return this._type;
		},

		setType: function (type) {
			this._type = type;
		},

		getShape: '#getType',
		setShape: '#setType',

		getSize: function () {
			var size = this._size;
			return new LinkedSize(size.width, size.height, this, 'setSize');
		},

		setSize: function () {
			var size = Size.read(arguments);
			if (!this._size) {
				this._size = size.clone();
			} else if (!this._size.equals(size)) {
				var type = this._type,
				    width = size.width,
				    height = size.height;
				if (type === 'rectangle') {
					this._radius.set(Size.min(this._radius, size.divide(2)));
				} else if (type === 'circle') {
					width = height = (width + height) / 2;
					this._radius = width / 2;
				} else if (type === 'ellipse') {
					this._radius._set(width / 2, height / 2);
				}
				this._size._set(width, height);
				this._changed(9);
			}
		},

		getRadius: function () {
			var rad = this._radius;
			return this._type === 'circle' ? rad : new LinkedSize(rad.width, rad.height, this, 'setRadius');
		},

		setRadius: function (radius) {
			var type = this._type;
			if (type === 'circle') {
				if (radius === this._radius) return;
				var size = radius * 2;
				this._radius = radius;
				this._size._set(size, size);
			} else {
				radius = Size.read(arguments);
				if (!this._radius) {
					this._radius = radius.clone();
				} else {
					if (this._radius.equals(radius)) return;
					this._radius.set(radius);
					if (type === 'rectangle') {
						var size = Size.max(this._size, radius.multiply(2));
						this._size.set(size);
					} else if (type === 'ellipse') {
						this._size._set(radius.width * 2, radius.height * 2);
					}
				}
			}
			this._changed(9);
		},

		isEmpty: function () {
			return false;
		},

		toPath: function (insert) {
			var path = new Path[Base.capitalize(this._type)]({
				center: new Point(),
				size: this._size,
				radius: this._radius,
				insert: false
			});
			path.copyAttributes(this);
			if (paper.settings.applyMatrix) path.setApplyMatrix(true);
			if (insert === undefined || insert) path.insertAbove(this);
			return path;
		},

		toShape: '#clone',

		_draw: function (ctx, param, viewMatrix, strokeMatrix) {
			var style = this._style,
			    hasFill = style.hasFill(),
			    hasStroke = style.hasStroke(),
			    dontPaint = param.dontFinish || param.clip,
			    untransformed = !strokeMatrix;
			if (hasFill || hasStroke || dontPaint) {
				var type = this._type,
				    radius = this._radius,
				    isCircle = type === 'circle';
				if (!param.dontStart) ctx.beginPath();
				if (untransformed && isCircle) {
					ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
				} else {
					var rx = isCircle ? radius : radius.width,
					    ry = isCircle ? radius : radius.height,
					    size = this._size,
					    width = size.width,
					    height = size.height;
					if (untransformed && type === 'rectangle' && rx === 0 && ry === 0) {
						ctx.rect(-width / 2, -height / 2, width, height);
					} else {
						var x = width / 2,
						    y = height / 2,
						    kappa = 1 - 0.5522847498307936,
						    cx = rx * kappa,
						    cy = ry * kappa,
						    c = [-x, -y + ry, -x, -y + cy, -x + cx, -y, -x + rx, -y, x - rx, -y, x - cx, -y, x, -y + cy, x, -y + ry, x, y - ry, x, y - cy, x - cx, y, x - rx, y, -x + rx, y, -x + cx, y, -x, y - cy, -x, y - ry];
						if (strokeMatrix) strokeMatrix.transform(c, c, 32);
						ctx.moveTo(c[0], c[1]);
						ctx.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
						if (x !== rx) ctx.lineTo(c[8], c[9]);
						ctx.bezierCurveTo(c[10], c[11], c[12], c[13], c[14], c[15]);
						if (y !== ry) ctx.lineTo(c[16], c[17]);
						ctx.bezierCurveTo(c[18], c[19], c[20], c[21], c[22], c[23]);
						if (x !== rx) ctx.lineTo(c[24], c[25]);
						ctx.bezierCurveTo(c[26], c[27], c[28], c[29], c[30], c[31]);
					}
				}
				ctx.closePath();
			}
			if (!dontPaint && (hasFill || hasStroke)) {
				this._setStyles(ctx, param, viewMatrix);
				if (hasFill) {
					ctx.fill(style.getFillRule());
					ctx.shadowColor = 'rgba(0,0,0,0)';
				}
				if (hasStroke) ctx.stroke();
			}
		},

		_canComposite: function () {
			return !(this.hasFill() && this.hasStroke());
		},

		_getBounds: function (matrix, options) {
			var rect = new Rectangle(this._size).setCenter(0, 0),
			    style = this._style,
			    strokeWidth = options.stroke && style.hasStroke() && style.getStrokeWidth();
			if (matrix) rect = matrix._transformBounds(rect);
			return strokeWidth ? rect.expand(Path._getStrokePadding(strokeWidth, this._getStrokeMatrix(matrix, options))) : rect;
		}
	}, new function () {
		function getCornerCenter(that, point, expand) {
			var radius = that._radius;
			if (!radius.isZero()) {
				var halfSize = that._size.divide(2);
				for (var q = 1; q <= 4; q++) {
					var dir = new Point(q > 1 && q < 4 ? -1 : 1, q > 2 ? -1 : 1),
					    corner = dir.multiply(halfSize),
					    center = corner.subtract(dir.multiply(radius)),
					    rect = new Rectangle(expand ? corner.add(dir.multiply(expand)) : corner, center);
					if (rect.contains(point)) return { point: center, quadrant: q };
				}
			}
		}

		function isOnEllipseStroke(point, radius, padding, quadrant) {
			var vector = point.divide(radius);
			return (!quadrant || vector.isInQuadrant(quadrant)) && vector.subtract(vector.normalize()).multiply(radius).divide(padding).length <= 1;
		}

		return {
			_contains: function _contains(point) {
				if (this._type === 'rectangle') {
					var center = getCornerCenter(this, point);
					return center ? point.subtract(center.point).divide(this._radius).getLength() <= 1 : _contains.base.call(this, point);
				} else {
					return point.divide(this.size).getLength() <= 0.5;
				}
			},

			_hitTestSelf: function _hitTestSelf(point, options, viewMatrix, strokeMatrix) {
				var hit = false,
				    style = this._style,
				    hitStroke = options.stroke && style.hasStroke(),
				    hitFill = options.fill && style.hasFill();
				if (hitStroke || hitFill) {
					var type = this._type,
					    radius = this._radius,
					    strokeRadius = hitStroke ? style.getStrokeWidth() / 2 : 0,
					    strokePadding = options._tolerancePadding.add(Path._getStrokePadding(strokeRadius, !style.getStrokeScaling() && strokeMatrix));
					if (type === 'rectangle') {
						var padding = strokePadding.multiply(2),
						    center = getCornerCenter(this, point, padding);
						if (center) {
							hit = isOnEllipseStroke(point.subtract(center.point), radius, strokePadding, center.quadrant);
						} else {
							var rect = new Rectangle(this._size).setCenter(0, 0),
							    outer = rect.expand(padding),
							    inner = rect.expand(padding.negate());
							hit = outer._containsPoint(point) && !inner._containsPoint(point);
						}
					} else {
						hit = isOnEllipseStroke(point, radius, strokePadding);
					}
				}
				return hit ? new HitResult(hitStroke ? 'stroke' : 'fill', this) : _hitTestSelf.base.apply(this, arguments);
			}
		};
	}(), {

		statics: new function () {
			function createShape(type, point, size, radius, args) {
				var item = new Shape(Base.getNamed(args));
				item._type = type;
				item._size = size;
				item._radius = radius;
				return item.translate(point);
			}

			return {
				Circle: function () {
					var center = Point.readNamed(arguments, 'center'),
					    radius = Base.readNamed(arguments, 'radius');
					return createShape('circle', center, new Size(radius * 2), radius, arguments);
				},

				Rectangle: function () {
					var rect = Rectangle.readNamed(arguments, 'rectangle'),
					    radius = Size.min(Size.readNamed(arguments, 'radius'), rect.getSize(true).divide(2));
					return createShape('rectangle', rect.getCenter(true), rect.getSize(true), radius, arguments);
				},

				Ellipse: function () {
					var ellipse = Shape._readEllipse(arguments),
					    radius = ellipse.radius;
					return createShape('ellipse', ellipse.center, radius.multiply(2), radius, arguments);
				},

				_readEllipse: function (args) {
					var center, radius;
					if (Base.hasNamed(args, 'radius')) {
						center = Point.readNamed(args, 'center');
						radius = Size.readNamed(args, 'radius');
					} else {
						var rect = Rectangle.readNamed(args, 'rectangle');
						center = rect.getCenter(true);
						radius = rect.getSize(true).divide(2);
					}
					return { center: center, radius: radius };
				}
			};
		}() });

	var Raster = Item.extend({
		_class: 'Raster',
		_applyMatrix: false,
		_canApplyMatrix: false,
		_boundsOptions: { stroke: false, handle: false },
		_serializeFields: {
			crossOrigin: null,
			source: null
		},
		_prioritize: ['crossOrigin'],

		initialize: function Raster(object, position) {
			if (!this._initialize(object, position !== undefined && Point.read(arguments, 1))) {
				var image = typeof object === 'string' ? document.getElementById(object) : object;
				if (image) {
					this.setImage(image);
				} else {
					this.setSource(object);
				}
			}
			if (!this._size) {
				this._size = new Size();
				this._loaded = false;
			}
		},

		_equals: function (item) {
			return this.getSource() === item.getSource();
		},

		copyContent: function (source) {
			var image = source._image,
			    canvas = source._canvas;
			if (image) {
				this._setImage(image);
			} else if (canvas) {
				var copyCanvas = CanvasProvider.getCanvas(source._size);
				copyCanvas.getContext('2d').drawImage(canvas, 0, 0);
				this._setImage(copyCanvas);
			}
			this._crossOrigin = source._crossOrigin;
		},

		getSize: function () {
			var size = this._size;
			return new LinkedSize(size ? size.width : 0, size ? size.height : 0, this, 'setSize');
		},

		setSize: function () {
			var size = Size.read(arguments);
			if (!size.equals(this._size)) {
				if (size.width > 0 && size.height > 0) {
					var element = this.getElement();
					this._setImage(CanvasProvider.getCanvas(size));
					if (element) this.getContext(true).drawImage(element, 0, 0, size.width, size.height);
				} else {
					if (this._canvas) CanvasProvider.release(this._canvas);
					this._size = size.clone();
				}
			}
		},

		getWidth: function () {
			return this._size ? this._size.width : 0;
		},

		setWidth: function (width) {
			this.setSize(width, this.getHeight());
		},

		getHeight: function () {
			return this._size ? this._size.height : 0;
		},

		setHeight: function (height) {
			this.setSize(this.getWidth(), height);
		},

		getLoaded: function () {
			return this._loaded;
		},

		isEmpty: function () {
			var size = this._size;
			return !size || size.width === 0 && size.height === 0;
		},

		getResolution: function () {
			var matrix = this._matrix,
			    orig = new Point(0, 0).transform(matrix),
			    u = new Point(1, 0).transform(matrix).subtract(orig),
			    v = new Point(0, 1).transform(matrix).subtract(orig);
			return new Size(72 / u.getLength(), 72 / v.getLength());
		},

		getPpi: '#getResolution',

		getImage: function () {
			return this._image;
		},

		setImage: function (image) {
			var that = this;

			function emit(event) {
				var view = that.getView(),
				    type = event && event.type || 'load';
				if (view && that.responds(type)) {
					paper = view._scope;
					that.emit(type, new Event(event));
				}
			}

			this._setImage(image);
			if (this._loaded) {
				setTimeout(emit, 0);
			} else if (image) {
				DomEvent.add(image, {
					load: function (event) {
						that._setImage(image);
						emit(event);
					},
					error: emit
				});
			}
		},

		_setImage: function (image) {
			if (this._canvas) CanvasProvider.release(this._canvas);
			if (image && image.getContext) {
				this._image = null;
				this._canvas = image;
				this._loaded = true;
			} else {
				this._image = image;
				this._canvas = null;
				this._loaded = !!(image && image.src && image.complete);
			}
			this._size = new Size(image ? image.naturalWidth || image.width : 0, image ? image.naturalHeight || image.height : 0);
			this._context = null;
			this._changed(521);
		},

		getCanvas: function () {
			if (!this._canvas) {
				var ctx = CanvasProvider.getContext(this._size);
				try {
					if (this._image) ctx.drawImage(this._image, 0, 0);
					this._canvas = ctx.canvas;
				} catch (e) {
					CanvasProvider.release(ctx);
				}
			}
			return this._canvas;
		},

		setCanvas: '#setImage',

		getContext: function (modify) {
			if (!this._context) this._context = this.getCanvas().getContext('2d');
			if (modify) {
				this._image = null;
				this._changed(513);
			}
			return this._context;
		},

		setContext: function (context) {
			this._context = context;
		},

		getSource: function () {
			var image = this._image;
			return image && image.src || this.toDataURL();
		},

		setSource: function (src) {
			var image = new self.Image(),
			    crossOrigin = this._crossOrigin;
			if (crossOrigin) image.crossOrigin = crossOrigin;
			image.src = src;
			this.setImage(image);
		},

		getCrossOrigin: function () {
			var image = this._image;
			return image && image.crossOrigin || this._crossOrigin || '';
		},

		setCrossOrigin: function (crossOrigin) {
			this._crossOrigin = crossOrigin;
			var image = this._image;
			if (image) image.crossOrigin = crossOrigin;
		},

		getElement: function () {
			return this._canvas || this._loaded && this._image;
		}
	}, {
		beans: false,

		getSubCanvas: function () {
			var rect = Rectangle.read(arguments),
			    ctx = CanvasProvider.getContext(rect.getSize());
			ctx.drawImage(this.getCanvas(), rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
			return ctx.canvas;
		},

		getSubRaster: function () {
			var rect = Rectangle.read(arguments),
			    raster = new Raster(Item.NO_INSERT);
			raster._setImage(this.getSubCanvas(rect));
			raster.translate(rect.getCenter().subtract(this.getSize().divide(2)));
			raster._matrix.prepend(this._matrix);
			raster.insertAbove(this);
			return raster;
		},

		toDataURL: function () {
			var image = this._image,
			    src = image && image.src;
			if (/^data:/.test(src)) return src;
			var canvas = this.getCanvas();
			return canvas ? canvas.toDataURL.apply(canvas, arguments) : null;
		},

		drawImage: function (image) {
			var point = Point.read(arguments, 1);
			this.getContext(true).drawImage(image, point.x, point.y);
		},

		getAverageColor: function (object) {
			var bounds, path;
			if (!object) {
				bounds = this.getBounds();
			} else if (object instanceof PathItem) {
				path = object;
				bounds = object.getBounds();
			} else if (typeof object === 'object') {
				if ('width' in object) {
					bounds = new Rectangle(object);
				} else if ('x' in object) {
					bounds = new Rectangle(object.x - 0.5, object.y - 0.5, 1, 1);
				}
			}
			if (!bounds) return null;
			var sampleSize = 32,
			    width = Math.min(bounds.width, sampleSize),
			    height = Math.min(bounds.height, sampleSize);
			var ctx = Raster._sampleContext;
			if (!ctx) {
				ctx = Raster._sampleContext = CanvasProvider.getContext(new Size(sampleSize));
			} else {
				ctx.clearRect(0, 0, sampleSize + 1, sampleSize + 1);
			}
			ctx.save();
			var matrix = new Matrix().scale(width / bounds.width, height / bounds.height).translate(-bounds.x, -bounds.y);
			matrix.applyToContext(ctx);
			if (path) path.draw(ctx, new Base({ clip: true, matrices: [matrix] }));
			this._matrix.applyToContext(ctx);
			var element = this.getElement(),
			    size = this._size;
			if (element) ctx.drawImage(element, -size.width / 2, -size.height / 2);
			ctx.restore();
			var pixels = ctx.getImageData(0.5, 0.5, Math.ceil(width), Math.ceil(height)).data,
			    channels = [0, 0, 0],
			    total = 0;
			for (var i = 0, l = pixels.length; i < l; i += 4) {
				var alpha = pixels[i + 3];
				total += alpha;
				alpha /= 255;
				channels[0] += pixels[i] * alpha;
				channels[1] += pixels[i + 1] * alpha;
				channels[2] += pixels[i + 2] * alpha;
			}
			for (var i = 0; i < 3; i++) channels[i] /= total;
			return total ? Color.read(channels) : null;
		},

		getPixel: function () {
			var point = Point.read(arguments);
			var data = this.getContext().getImageData(point.x, point.y, 1, 1).data;
			return new Color('rgb', [data[0] / 255, data[1] / 255, data[2] / 255], data[3] / 255);
		},

		setPixel: function () {
			var point = Point.read(arguments),
			    color = Color.read(arguments),
			    components = color._convert('rgb'),
			    alpha = color._alpha,
			    ctx = this.getContext(true),
			    imageData = ctx.createImageData(1, 1),
			    data = imageData.data;
			data[0] = components[0] * 255;
			data[1] = components[1] * 255;
			data[2] = components[2] * 255;
			data[3] = alpha != null ? alpha * 255 : 255;
			ctx.putImageData(imageData, point.x, point.y);
		},

		createImageData: function () {
			var size = Size.read(arguments);
			return this.getContext().createImageData(size.width, size.height);
		},

		getImageData: function () {
			var rect = Rectangle.read(arguments);
			if (rect.isEmpty()) rect = new Rectangle(this._size);
			return this.getContext().getImageData(rect.x, rect.y, rect.width, rect.height);
		},

		setImageData: function (data) {
			var point = Point.read(arguments, 1);
			this.getContext(true).putImageData(data, point.x, point.y);
		},

		_getBounds: function (matrix, options) {
			var rect = new Rectangle(this._size).setCenter(0, 0);
			return matrix ? matrix._transformBounds(rect) : rect;
		},

		_hitTestSelf: function (point) {
			if (this._contains(point)) {
				var that = this;
				return new HitResult('pixel', that, {
					offset: point.add(that._size.divide(2)).round(),
					color: {
						get: function () {
							return that.getPixel(this.offset);
						}
					}
				});
			}
		},

		_draw: function (ctx) {
			var element = this.getElement();
			if (element) {
				ctx.globalAlpha = this._opacity;
				ctx.drawImage(element, -this._size.width / 2, -this._size.height / 2);
			}
		},

		_canComposite: function () {
			return true;
		}
	});

	var SymbolItem = Item.extend({
		_class: 'SymbolItem',
		_applyMatrix: false,
		_canApplyMatrix: false,
		_boundsOptions: { stroke: true },
		_serializeFields: {
			symbol: null
		},

		initialize: function SymbolItem(arg0, arg1) {
			if (!this._initialize(arg0, arg1 !== undefined && Point.read(arguments, 1))) this.setDefinition(arg0 instanceof SymbolDefinition ? arg0 : new SymbolDefinition(arg0));
		},

		_equals: function (item) {
			return this._definition === item._definition;
		},

		copyContent: function (source) {
			this.setDefinition(source._definition);
		},

		getDefinition: function () {
			return this._definition;
		},

		setDefinition: function (definition) {
			this._definition = definition;
			this._changed(9);
		},

		getSymbol: '#getDefinition',
		setSymbol: '#setDefinition',

		isEmpty: function () {
			return this._definition._item.isEmpty();
		},

		_getBounds: function (matrix, options) {
			var item = this._definition._item;
			return item._getCachedBounds(item._matrix.prepended(matrix), options);
		},

		_hitTestSelf: function (point, options, viewMatrix, strokeMatrix) {
			var res = this._definition._item._hitTest(point, options, viewMatrix);
			if (res) res.item = this;
			return res;
		},

		_draw: function (ctx, param) {
			this._definition._item.draw(ctx, param);
		}

	});

	var SymbolDefinition = Base.extend({
		_class: 'SymbolDefinition',

		initialize: function SymbolDefinition(item, dontCenter) {
			this._id = UID.get();
			this.project = paper.project;
			if (item) this.setItem(item, dontCenter);
		},

		_serialize: function (options, dictionary) {
			return dictionary.add(this, function () {
				return Base.serialize([this._class, this._item], options, false, dictionary);
			});
		},

		_changed: function (flags) {
			if (flags & 8) Item._clearBoundsCache(this);
			if (flags & 1) this.project._changed(flags);
		},

		getItem: function () {
			return this._item;
		},

		setItem: function (item, _dontCenter) {
			if (item._symbol) item = item.clone();
			if (this._item) this._item._symbol = null;
			this._item = item;
			item.remove();
			item.setSelected(false);
			if (!_dontCenter) item.setPosition(new Point());
			item._symbol = this;
			this._changed(9);
		},

		getDefinition: '#getItem',
		setDefinition: '#setItem',

		place: function (position) {
			return new SymbolItem(this, position);
		},

		clone: function () {
			return new SymbolDefinition(this._item.clone(false));
		},

		equals: function (symbol) {
			return symbol === this || symbol && this._item.equals(symbol._item) || false;
		}
	});

	var HitResult = Base.extend({
		_class: 'HitResult',

		initialize: function HitResult(type, item, values) {
			this.type = type;
			this.item = item;
			if (values) {
				values.enumerable = true;
				this.inject(values);
			}
		},

		statics: {
			getOptions: function (args) {
				var options = args && Base.read(args);
				return Base.set({
					type: null,
					tolerance: paper.settings.hitTolerance,
					fill: !options,
					stroke: !options,
					segments: !options,
					handles: false,
					ends: false,
					center: false,
					bounds: false,
					guides: false,
					selected: false
				}, options);
			}
		}
	});

	var Segment = Base.extend({
		_class: 'Segment',
		beans: true,
		_selection: 0,

		initialize: function Segment(arg0, arg1, arg2, arg3, arg4, arg5) {
			var count = arguments.length,
			    point,
			    handleIn,
			    handleOut,
			    selection;
			if (count > 0) {
				if (arg0 == null || typeof arg0 === 'object') {
					if (count === 1 && arg0 && 'point' in arg0) {
						point = arg0.point;
						handleIn = arg0.handleIn;
						handleOut = arg0.handleOut;
						selection = arg0.selection;
					} else {
						point = arg0;
						handleIn = arg1;
						handleOut = arg2;
						selection = arg3;
					}
				} else {
					point = [arg0, arg1];
					handleIn = arg2 !== undefined ? [arg2, arg3] : null;
					handleOut = arg4 !== undefined ? [arg4, arg5] : null;
				}
			}
			new SegmentPoint(point, this, '_point');
			new SegmentPoint(handleIn, this, '_handleIn');
			new SegmentPoint(handleOut, this, '_handleOut');
			if (selection) this.setSelection(selection);
		},

		_serialize: function (options, dictionary) {
			var point = this._point,
			    selection = this._selection,
			    obj = selection || this.hasHandles() ? [point, this._handleIn, this._handleOut] : point;
			if (selection) obj.push(selection);
			return Base.serialize(obj, options, true, dictionary);
		},

		_changed: function (point) {
			var path = this._path;
			if (!path) return;
			var curves = path._curves,
			    index = this._index,
			    curve;
			if (curves) {
				if ((!point || point === this._point || point === this._handleIn) && (curve = index > 0 ? curves[index - 1] : path._closed ? curves[curves.length - 1] : null)) curve._changed();
				if ((!point || point === this._point || point === this._handleOut) && (curve = curves[index])) curve._changed();
			}
			path._changed(25);
		},

		getPoint: function () {
			return this._point;
		},

		setPoint: function () {
			this._point.set(Point.read(arguments));
		},

		getHandleIn: function () {
			return this._handleIn;
		},

		setHandleIn: function () {
			this._handleIn.set(Point.read(arguments));
		},

		getHandleOut: function () {
			return this._handleOut;
		},

		setHandleOut: function () {
			this._handleOut.set(Point.read(arguments));
		},

		hasHandles: function () {
			return !this._handleIn.isZero() || !this._handleOut.isZero();
		},

		isSmooth: function () {
			var handleIn = this._handleIn,
			    handleOut = this._handleOut;
			return !handleIn.isZero() && !handleOut.isZero() && handleIn.isCollinear(handleOut);
		},

		clearHandles: function () {
			this._handleIn._set(0, 0);
			this._handleOut._set(0, 0);
		},

		getSelection: function () {
			return this._selection;
		},

		setSelection: function (selection) {
			var oldSelection = this._selection,
			    path = this._path;
			this._selection = selection = selection || 0;
			if (path && selection !== oldSelection) {
				path._updateSelection(this, oldSelection, selection);
				path._changed(129);
			}
		},

		changeSelection: function (flag, selected) {
			var selection = this._selection;
			this.setSelection(selected ? selection | flag : selection & ~flag);
		},

		isSelected: function () {
			return !!(this._selection & 7);
		},

		setSelected: function (selected) {
			this.changeSelection(7, selected);
		},

		getIndex: function () {
			return this._index !== undefined ? this._index : null;
		},

		getPath: function () {
			return this._path || null;
		},

		getCurve: function () {
			var path = this._path,
			    index = this._index;
			if (path) {
				if (index > 0 && !path._closed && index === path._segments.length - 1) index--;
				return path.getCurves()[index] || null;
			}
			return null;
		},

		getLocation: function () {
			var curve = this.getCurve();
			return curve ? new CurveLocation(curve, this === curve._segment1 ? 0 : 1) : null;
		},

		getNext: function () {
			var segments = this._path && this._path._segments;
			return segments && (segments[this._index + 1] || this._path._closed && segments[0]) || null;
		},

		smooth: function (options, _first, _last) {
			var opts = options || {},
			    type = opts.type,
			    factor = opts.factor,
			    prev = this.getPrevious(),
			    next = this.getNext(),
			    p0 = (prev || this)._point,
			    p1 = this._point,
			    p2 = (next || this)._point,
			    d1 = p0.getDistance(p1),
			    d2 = p1.getDistance(p2);
			if (!type || type === 'catmull-rom') {
				var a = factor === undefined ? 0.5 : factor,
				    d1_a = Math.pow(d1, a),
				    d1_2a = d1_a * d1_a,
				    d2_a = Math.pow(d2, a),
				    d2_2a = d2_a * d2_a;
				if (!_first && prev) {
					var A = 2 * d2_2a + 3 * d2_a * d1_a + d1_2a,
					    N = 3 * d2_a * (d2_a + d1_a);
					this.setHandleIn(N !== 0 ? new Point((d2_2a * p0._x + A * p1._x - d1_2a * p2._x) / N - p1._x, (d2_2a * p0._y + A * p1._y - d1_2a * p2._y) / N - p1._y) : new Point());
				}
				if (!_last && next) {
					var A = 2 * d1_2a + 3 * d1_a * d2_a + d2_2a,
					    N = 3 * d1_a * (d1_a + d2_a);
					this.setHandleOut(N !== 0 ? new Point((d1_2a * p2._x + A * p1._x - d2_2a * p0._x) / N - p1._x, (d1_2a * p2._y + A * p1._y - d2_2a * p0._y) / N - p1._y) : new Point());
				}
			} else if (type === 'geometric') {
				if (prev && next) {
					var vector = p0.subtract(p2),
					    t = factor === undefined ? 0.4 : factor,
					    k = t * d1 / (d1 + d2);
					if (!_first) this.setHandleIn(vector.multiply(k));
					if (!_last) this.setHandleOut(vector.multiply(k - t));
				}
			} else {
				throw new Error('Smoothing method \'' + type + '\' not supported.');
			}
		},

		getPrevious: function () {
			var segments = this._path && this._path._segments;
			return segments && (segments[this._index - 1] || this._path._closed && segments[segments.length - 1]) || null;
		},

		isFirst: function () {
			return !this._index;
		},

		isLast: function () {
			var path = this._path;
			return path && this._index === path._segments.length - 1 || false;
		},

		reverse: function () {
			var handleIn = this._handleIn,
			    handleOut = this._handleOut,
			    tmp = handleIn.clone();
			handleIn.set(handleOut);
			handleOut.set(tmp);
		},

		reversed: function () {
			return new Segment(this._point, this._handleOut, this._handleIn);
		},

		remove: function () {
			return this._path ? !!this._path.removeSegment(this._index) : false;
		},

		clone: function () {
			return new Segment(this._point, this._handleIn, this._handleOut);
		},

		equals: function (segment) {
			return segment === this || segment && this._class === segment._class && this._point.equals(segment._point) && this._handleIn.equals(segment._handleIn) && this._handleOut.equals(segment._handleOut) || false;
		},

		toString: function () {
			var parts = ['point: ' + this._point];
			if (!this._handleIn.isZero()) parts.push('handleIn: ' + this._handleIn);
			if (!this._handleOut.isZero()) parts.push('handleOut: ' + this._handleOut);
			return '{ ' + parts.join(', ') + ' }';
		},

		transform: function (matrix) {
			this._transformCoordinates(matrix, new Array(6), true);
			this._changed();
		},

		interpolate: function (from, to, factor) {
			var u = 1 - factor,
			    v = factor,
			    point1 = from._point,
			    point2 = to._point,
			    handleIn1 = from._handleIn,
			    handleIn2 = to._handleIn,
			    handleOut2 = to._handleOut,
			    handleOut1 = from._handleOut;
			this._point._set(u * point1._x + v * point2._x, u * point1._y + v * point2._y, true);
			this._handleIn._set(u * handleIn1._x + v * handleIn2._x, u * handleIn1._y + v * handleIn2._y, true);
			this._handleOut._set(u * handleOut1._x + v * handleOut2._x, u * handleOut1._y + v * handleOut2._y, true);
			this._changed();
		},

		_transformCoordinates: function (matrix, coords, change) {
			var point = this._point,
			    handleIn = !change || !this._handleIn.isZero() ? this._handleIn : null,
			    handleOut = !change || !this._handleOut.isZero() ? this._handleOut : null,
			    x = point._x,
			    y = point._y,
			    i = 2;
			coords[0] = x;
			coords[1] = y;
			if (handleIn) {
				coords[i++] = handleIn._x + x;
				coords[i++] = handleIn._y + y;
			}
			if (handleOut) {
				coords[i++] = handleOut._x + x;
				coords[i++] = handleOut._y + y;
			}
			if (matrix) {
				matrix._transformCoordinates(coords, coords, i / 2);
				x = coords[0];
				y = coords[1];
				if (change) {
					point._x = x;
					point._y = y;
					i = 2;
					if (handleIn) {
						handleIn._x = coords[i++] - x;
						handleIn._y = coords[i++] - y;
					}
					if (handleOut) {
						handleOut._x = coords[i++] - x;
						handleOut._y = coords[i++] - y;
					}
				} else {
					if (!handleIn) {
						coords[i++] = x;
						coords[i++] = y;
					}
					if (!handleOut) {
						coords[i++] = x;
						coords[i++] = y;
					}
				}
			}
			return coords;
		}
	});

	var SegmentPoint = Point.extend({
		initialize: function SegmentPoint(point, owner, key) {
			var x, y, selected;
			if (!point) {
				x = y = 0;
			} else if ((x = point[0]) !== undefined) {
				y = point[1];
			} else {
				var pt = point;
				if ((x = pt.x) === undefined) {
					pt = Point.read(arguments);
					x = pt.x;
				}
				y = pt.y;
				selected = pt.selected;
			}
			this._x = x;
			this._y = y;
			this._owner = owner;
			owner[key] = this;
			if (selected) this.setSelected(true);
		},

		_set: function (x, y) {
			this._x = x;
			this._y = y;
			this._owner._changed(this);
			return this;
		},

		getX: function () {
			return this._x;
		},

		setX: function (x) {
			this._x = x;
			this._owner._changed(this);
		},

		getY: function () {
			return this._y;
		},

		setY: function (y) {
			this._y = y;
			this._owner._changed(this);
		},

		isZero: function () {
			var isZero = Numerical.isZero;
			return isZero(this._x) && isZero(this._y);
		},

		isSelected: function () {
			return !!(this._owner._selection & this._getSelection());
		},

		setSelected: function (selected) {
			this._owner.changeSelection(this._getSelection(), selected);
		},

		_getSelection: function () {
			var owner = this._owner;
			return this === owner._point ? 1 : this === owner._handleIn ? 2 : this === owner._handleOut ? 4 : 0;
		}
	});

	var Curve = Base.extend({
		_class: 'Curve',
		beans: true,

		initialize: function Curve(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
			var count = arguments.length,
			    seg1,
			    seg2,
			    point1,
			    point2,
			    handle1,
			    handle2;
			if (count === 3) {
				this._path = arg0;
				seg1 = arg1;
				seg2 = arg2;
			} else if (!count) {
				seg1 = new Segment();
				seg2 = new Segment();
			} else if (count === 1) {
				if ('segment1' in arg0) {
					seg1 = new Segment(arg0.segment1);
					seg2 = new Segment(arg0.segment2);
				} else if ('point1' in arg0) {
					point1 = arg0.point1;
					handle1 = arg0.handle1;
					handle2 = arg0.handle2;
					point2 = arg0.point2;
				} else if (Array.isArray(arg0)) {
					point1 = [arg0[0], arg0[1]];
					point2 = [arg0[6], arg0[7]];
					handle1 = [arg0[2] - arg0[0], arg0[3] - arg0[1]];
					handle2 = [arg0[4] - arg0[6], arg0[5] - arg0[7]];
				}
			} else if (count === 2) {
				seg1 = new Segment(arg0);
				seg2 = new Segment(arg1);
			} else if (count === 4) {
				point1 = arg0;
				handle1 = arg1;
				handle2 = arg2;
				point2 = arg3;
			} else if (count === 8) {
				point1 = [arg0, arg1];
				point2 = [arg6, arg7];
				handle1 = [arg2 - arg0, arg3 - arg1];
				handle2 = [arg4 - arg6, arg5 - arg7];
			}
			this._segment1 = seg1 || new Segment(point1, null, handle1);
			this._segment2 = seg2 || new Segment(point2, handle2, null);
		},

		_serialize: function (options, dictionary) {
			return Base.serialize(this.hasHandles() ? [this.getPoint1(), this.getHandle1(), this.getHandle2(), this.getPoint2()] : [this.getPoint1(), this.getPoint2()], options, true, dictionary);
		},

		_changed: function () {
			this._length = this._bounds = undefined;
		},

		clone: function () {
			return new Curve(this._segment1, this._segment2);
		},

		toString: function () {
			var parts = ['point1: ' + this._segment1._point];
			if (!this._segment1._handleOut.isZero()) parts.push('handle1: ' + this._segment1._handleOut);
			if (!this._segment2._handleIn.isZero()) parts.push('handle2: ' + this._segment2._handleIn);
			parts.push('point2: ' + this._segment2._point);
			return '{ ' + parts.join(', ') + ' }';
		},

		classify: function () {
			return Curve.classify(this.getValues());
		},

		remove: function () {
			var removed = false;
			if (this._path) {
				var segment2 = this._segment2,
				    handleOut = segment2._handleOut;
				removed = segment2.remove();
				if (removed) this._segment1._handleOut.set(handleOut);
			}
			return removed;
		},

		getPoint1: function () {
			return this._segment1._point;
		},

		setPoint1: function () {
			this._segment1._point.set(Point.read(arguments));
		},

		getPoint2: function () {
			return this._segment2._point;
		},

		setPoint2: function () {
			this._segment2._point.set(Point.read(arguments));
		},

		getHandle1: function () {
			return this._segment1._handleOut;
		},

		setHandle1: function () {
			this._segment1._handleOut.set(Point.read(arguments));
		},

		getHandle2: function () {
			return this._segment2._handleIn;
		},

		setHandle2: function () {
			this._segment2._handleIn.set(Point.read(arguments));
		},

		getSegment1: function () {
			return this._segment1;
		},

		getSegment2: function () {
			return this._segment2;
		},

		getPath: function () {
			return this._path;
		},

		getIndex: function () {
			return this._segment1._index;
		},

		getNext: function () {
			var curves = this._path && this._path._curves;
			return curves && (curves[this._segment1._index + 1] || this._path._closed && curves[0]) || null;
		},

		getPrevious: function () {
			var curves = this._path && this._path._curves;
			return curves && (curves[this._segment1._index - 1] || this._path._closed && curves[curves.length - 1]) || null;
		},

		isFirst: function () {
			return !this._segment1._index;
		},

		isLast: function () {
			var path = this._path;
			return path && this._segment1._index === path._curves.length - 1 || false;
		},

		isSelected: function () {
			return this.getPoint1().isSelected() && this.getHandle2().isSelected() && this.getHandle2().isSelected() && this.getPoint2().isSelected();
		},

		setSelected: function (selected) {
			this.getPoint1().setSelected(selected);
			this.getHandle1().setSelected(selected);
			this.getHandle2().setSelected(selected);
			this.getPoint2().setSelected(selected);
		},

		getValues: function (matrix) {
			return Curve.getValues(this._segment1, this._segment2, matrix);
		},

		getPoints: function () {
			var coords = this.getValues(),
			    points = [];
			for (var i = 0; i < 8; i += 2) points.push(new Point(coords[i], coords[i + 1]));
			return points;
		}
	}, {
		getLength: function () {
			if (this._length == null) this._length = Curve.getLength(this.getValues(), 0, 1);
			return this._length;
		},

		getArea: function () {
			return Curve.getArea(this.getValues());
		},

		getLine: function () {
			return new Line(this._segment1._point, this._segment2._point);
		},

		getPart: function (from, to) {
			return new Curve(Curve.getPart(this.getValues(), from, to));
		},

		getPartLength: function (from, to) {
			return Curve.getLength(this.getValues(), from, to);
		},

		divideAt: function (location) {
			return this.divideAtTime(location && location.curve === this ? location.time : this.getTimeAt(location));
		},

		divideAtTime: function (time, _setHandles) {
			var tMin = 1e-8,
			    tMax = 1 - tMin,
			    res = null;
			if (time >= tMin && time <= tMax) {
				var parts = Curve.subdivide(this.getValues(), time),
				    left = parts[0],
				    right = parts[1],
				    setHandles = _setHandles || this.hasHandles(),
				    seg1 = this._segment1,
				    seg2 = this._segment2,
				    path = this._path;
				if (setHandles) {
					seg1._handleOut._set(left[2] - left[0], left[3] - left[1]);
					seg2._handleIn._set(right[4] - right[6], right[5] - right[7]);
				}
				var x = left[6],
				    y = left[7],
				    segment = new Segment(new Point(x, y), setHandles && new Point(left[4] - x, left[5] - y), setHandles && new Point(right[2] - x, right[3] - y));
				if (path) {
					path.insert(seg1._index + 1, segment);
					res = this.getNext();
				} else {
					this._segment2 = segment;
					this._changed();
					res = new Curve(segment, seg2);
				}
			}
			return res;
		},

		splitAt: function (location) {
			var path = this._path;
			return path ? path.splitAt(location) : null;
		},

		splitAtTime: function (time) {
			return this.splitAt(this.getLocationAtTime(time));
		},

		divide: function (offset, isTime) {
			return this.divideAtTime(offset === undefined ? 0.5 : isTime ? offset : this.getTimeAt(offset));
		},

		split: function (offset, isTime) {
			return this.splitAtTime(offset === undefined ? 0.5 : isTime ? offset : this.getTimeAt(offset));
		},

		reversed: function () {
			return new Curve(this._segment2.reversed(), this._segment1.reversed());
		},

		clearHandles: function () {
			this._segment1._handleOut._set(0, 0);
			this._segment2._handleIn._set(0, 0);
		},

		statics: {
			getValues: function (segment1, segment2, matrix, straight) {
				var p1 = segment1._point,
				    h1 = segment1._handleOut,
				    h2 = segment2._handleIn,
				    p2 = segment2._point,
				    x1 = p1.x,
				    y1 = p1.y,
				    x2 = p2.x,
				    y2 = p2.y,
				    values = straight ? [x1, y1, x1, y1, x2, y2, x2, y2] : [x1, y1, x1 + h1._x, y1 + h1._y, x2 + h2._x, y2 + h2._y, x2, y2];
				if (matrix) matrix._transformCoordinates(values, values, 4);
				return values;
			},

			subdivide: function (v, t) {
				var x0 = v[0],
				    y0 = v[1],
				    x1 = v[2],
				    y1 = v[3],
				    x2 = v[4],
				    y2 = v[5],
				    x3 = v[6],
				    y3 = v[7];
				if (t === undefined) t = 0.5;
				var u = 1 - t,
				    x4 = u * x0 + t * x1,
				    y4 = u * y0 + t * y1,
				    x5 = u * x1 + t * x2,
				    y5 = u * y1 + t * y2,
				    x6 = u * x2 + t * x3,
				    y6 = u * y2 + t * y3,
				    x7 = u * x4 + t * x5,
				    y7 = u * y4 + t * y5,
				    x8 = u * x5 + t * x6,
				    y8 = u * y5 + t * y6,
				    x9 = u * x7 + t * x8,
				    y9 = u * y7 + t * y8;
				return [[x0, y0, x4, y4, x7, y7, x9, y9], [x9, y9, x8, y8, x6, y6, x3, y3]];
			},

			getMonoCurves: function (v, dir) {
				var curves = [],
				    io = dir ? 0 : 1,
				    o0 = v[io + 0],
				    o1 = v[io + 2],
				    o2 = v[io + 4],
				    o3 = v[io + 6];
				if (o0 >= o1 === o1 >= o2 && o1 >= o2 === o2 >= o3 || Curve.isStraight(v)) {
					curves.push(v);
				} else {
					var a = 3 * (o1 - o2) - o0 + o3,
					    b = 2 * (o0 + o2) - 4 * o1,
					    c = o1 - o0,
					    tMin = 1e-8,
					    tMax = 1 - tMin,
					    roots = [],
					    n = Numerical.solveQuadratic(a, b, c, roots, tMin, tMax);
					if (!n) {
						curves.push(v);
					} else {
						roots.sort();
						var t = roots[0],
						    parts = Curve.subdivide(v, t);
						curves.push(parts[0]);
						if (n > 1) {
							t = (roots[1] - t) / (1 - t);
							parts = Curve.subdivide(parts[1], t);
							curves.push(parts[0]);
						}
						curves.push(parts[1]);
					}
				}
				return curves;
			},

			solveCubic: function (v, coord, val, roots, min, max) {
				var v0 = v[coord],
				    v1 = v[coord + 2],
				    v2 = v[coord + 4],
				    v3 = v[coord + 6],
				    res = 0;
				if (!(v0 < val && v3 < val && v1 < val && v2 < val || v0 > val && v3 > val && v1 > val && v2 > val)) {
					var c = 3 * (v1 - v0),
					    b = 3 * (v2 - v1) - c,
					    a = v3 - v0 - c - b;
					res = Numerical.solveCubic(a, b, c, v0 - val, roots, min, max);
				}
				return res;
			},

			getTimeOf: function (v, point) {
				var p0 = new Point(v[0], v[1]),
				    p3 = new Point(v[6], v[7]),
				    epsilon = 1e-12,
				    geomEpsilon = 1e-7,
				    t = point.isClose(p0, epsilon) ? 0 : point.isClose(p3, epsilon) ? 1 : null;
				if (t === null) {
					var coords = [point.x, point.y],
					    roots = [];
					for (var c = 0; c < 2; c++) {
						var count = Curve.solveCubic(v, c, coords[c], roots, 0, 1);
						for (var i = 0; i < count; i++) {
							var u = roots[i];
							if (point.isClose(Curve.getPoint(v, u), geomEpsilon)) return u;
						}
					}
				}
				return point.isClose(p0, geomEpsilon) ? 0 : point.isClose(p3, geomEpsilon) ? 1 : null;
			},

			getNearestTime: function (v, point) {
				if (Curve.isStraight(v)) {
					var x0 = v[0],
					    y0 = v[1],
					    x3 = v[6],
					    y3 = v[7],
					    vx = x3 - x0,
					    vy = y3 - y0,
					    det = vx * vx + vy * vy;
					if (det === 0) return 0;
					var u = ((point.x - x0) * vx + (point.y - y0) * vy) / det;
					return u < 1e-12 ? 0 : u > 0.999999999999 ? 1 : Curve.getTimeOf(v, new Point(x0 + u * vx, y0 + u * vy));
				}

				var count = 100,
				    minDist = Infinity,
				    minT = 0;

				function refine(t) {
					if (t >= 0 && t <= 1) {
						var dist = point.getDistance(Curve.getPoint(v, t), true);
						if (dist < minDist) {
							minDist = dist;
							minT = t;
							return true;
						}
					}
				}

				for (var i = 0; i <= count; i++) refine(i / count);

				var step = 1 / (count * 2);
				while (step > 1e-8) {
					if (!refine(minT - step) && !refine(minT + step)) step /= 2;
				}
				return minT;
			},

			getPart: function (v, from, to) {
				var flip = from > to;
				if (flip) {
					var tmp = from;
					from = to;
					to = tmp;
				}
				if (from > 0) v = Curve.subdivide(v, from)[1];
				if (to < 1) v = Curve.subdivide(v, (to - from) / (1 - from))[0];
				return flip ? [v[6], v[7], v[4], v[5], v[2], v[3], v[0], v[1]] : v;
			},

			isFlatEnough: function (v, flatness) {
				var x0 = v[0],
				    y0 = v[1],
				    x1 = v[2],
				    y1 = v[3],
				    x2 = v[4],
				    y2 = v[5],
				    x3 = v[6],
				    y3 = v[7],
				    ux = 3 * x1 - 2 * x0 - x3,
				    uy = 3 * y1 - 2 * y0 - y3,
				    vx = 3 * x2 - 2 * x3 - x0,
				    vy = 3 * y2 - 2 * y3 - y0;
				return Math.max(ux * ux, vx * vx) + Math.max(uy * uy, vy * vy) <= 16 * flatness * flatness;
			},

			getArea: function (v) {
				var x0 = v[0],
				    y0 = v[1],
				    x1 = v[2],
				    y1 = v[3],
				    x2 = v[4],
				    y2 = v[5],
				    x3 = v[6],
				    y3 = v[7];
				return 3 * ((y3 - y0) * (x1 + x2) - (x3 - x0) * (y1 + y2) + y1 * (x0 - x2) - x1 * (y0 - y2) + y3 * (x2 + x0 / 3) - x3 * (y2 + y0 / 3)) / 20;
			},

			getBounds: function (v) {
				var min = v.slice(0, 2),
				    max = min.slice(),
				    roots = [0, 0];
				for (var i = 0; i < 2; i++) Curve._addBounds(v[i], v[i + 2], v[i + 4], v[i + 6], i, 0, min, max, roots);
				return new Rectangle(min[0], min[1], max[0] - min[0], max[1] - min[1]);
			},

			_addBounds: function (v0, v1, v2, v3, coord, padding, min, max, roots) {
				function add(value, padding) {
					var left = value - padding,
					    right = value + padding;
					if (left < min[coord]) min[coord] = left;
					if (right > max[coord]) max[coord] = right;
				}

				padding /= 2;
				var minPad = min[coord] - padding,
				    maxPad = max[coord] + padding;
				if (v0 < minPad || v1 < minPad || v2 < minPad || v3 < minPad || v0 > maxPad || v1 > maxPad || v2 > maxPad || v3 > maxPad) {
					if (v1 < v0 != v1 < v3 && v2 < v0 != v2 < v3) {
						add(v0, padding);
						add(v3, padding);
					} else {
						var a = 3 * (v1 - v2) - v0 + v3,
						    b = 2 * (v0 + v2) - 4 * v1,
						    c = v1 - v0,
						    count = Numerical.solveQuadratic(a, b, c, roots),
						    tMin = 1e-8,
						    tMax = 1 - tMin;
						add(v3, 0);
						for (var i = 0; i < count; i++) {
							var t = roots[i],
							    u = 1 - t;
							if (tMin <= t && t <= tMax) add(u * u * u * v0 + 3 * u * u * t * v1 + 3 * u * t * t * v2 + t * t * t * v3, padding);
						}
					}
				}
			}
		} }, Base.each(['getBounds', 'getStrokeBounds', 'getHandleBounds'], function (name) {
		this[name] = function () {
			if (!this._bounds) this._bounds = {};
			var bounds = this._bounds[name];
			if (!bounds) {
				bounds = this._bounds[name] = Path[name]([this._segment1, this._segment2], false, this._path);
			}
			return bounds.clone();
		};
	}, {}), Base.each({
		isStraight: function (p1, h1, h2, p2) {
			if (h1.isZero() && h2.isZero()) {
				return true;
			} else {
				var v = p2.subtract(p1);
				if (v.isZero()) {
					return false;
				} else if (v.isCollinear(h1) && v.isCollinear(h2)) {
					var l = new Line(p1, p2),
					    epsilon = 1e-7;
					if (l.getDistance(p1.add(h1)) < epsilon && l.getDistance(p2.add(h2)) < epsilon) {
						var div = v.dot(v),
						    s1 = v.dot(h1) / div,
						    s2 = v.dot(h2) / div;
						return s1 >= 0 && s1 <= 1 && s2 <= 0 && s2 >= -1;
					}
				}
			}
			return false;
		},

		isLinear: function (p1, h1, h2, p2) {
			var third = p2.subtract(p1).divide(3);
			return h1.equals(third) && h2.negate().equals(third);
		}
	}, function (test, name) {
		this[name] = function (epsilon) {
			var seg1 = this._segment1,
			    seg2 = this._segment2;
			return test(seg1._point, seg1._handleOut, seg2._handleIn, seg2._point, epsilon);
		};

		this.statics[name] = function (v, epsilon) {
			var x0 = v[0],
			    y0 = v[1],
			    x3 = v[6],
			    y3 = v[7];
			return test(new Point(x0, y0), new Point(v[2] - x0, v[3] - y0), new Point(v[4] - x3, v[5] - y3), new Point(x3, y3), epsilon);
		};
	}, {
		statics: {},

		hasHandles: function () {
			return !this._segment1._handleOut.isZero() || !this._segment2._handleIn.isZero();
		},

		hasLength: function (epsilon) {
			return (!this.getPoint1().equals(this.getPoint2()) || this.hasHandles()) && this.getLength() > (epsilon || 0);
		},

		isCollinear: function (curve) {
			return curve && this.isStraight() && curve.isStraight() && this.getLine().isCollinear(curve.getLine());
		},

		isHorizontal: function () {
			return this.isStraight() && Math.abs(this.getTangentAtTime(0.5).y) < 1e-8;
		},

		isVertical: function () {
			return this.isStraight() && Math.abs(this.getTangentAtTime(0.5).x) < 1e-8;
		}
	}), {
		beans: false,

		getLocationAt: function (offset, _isTime) {
			return this.getLocationAtTime(_isTime ? offset : this.getTimeAt(offset));
		},

		getLocationAtTime: function (t) {
			return t != null && t >= 0 && t <= 1 ? new CurveLocation(this, t) : null;
		},

		getTimeAt: function (offset, start) {
			return Curve.getTimeAt(this.getValues(), offset, start);
		},

		getParameterAt: '#getTimeAt',

		getOffsetAtTime: function (t) {
			return this.getPartLength(0, t);
		},

		getLocationOf: function () {
			return this.getLocationAtTime(this.getTimeOf(Point.read(arguments)));
		},

		getOffsetOf: function () {
			var loc = this.getLocationOf.apply(this, arguments);
			return loc ? loc.getOffset() : null;
		},

		getTimeOf: function () {
			return Curve.getTimeOf(this.getValues(), Point.read(arguments));
		},

		getParameterOf: '#getTimeOf',

		getNearestLocation: function () {
			var point = Point.read(arguments),
			    values = this.getValues(),
			    t = Curve.getNearestTime(values, point),
			    pt = Curve.getPoint(values, t);
			return new CurveLocation(this, t, pt, null, point.getDistance(pt));
		},

		getNearestPoint: function () {
			var loc = this.getNearestLocation.apply(this, arguments);
			return loc ? loc.getPoint() : loc;
		}

	}, new function () {
		var methods = ['getPoint', 'getTangent', 'getNormal', 'getWeightedTangent', 'getWeightedNormal', 'getCurvature'];
		return Base.each(methods, function (name) {
			this[name + 'At'] = function (location, _isTime) {
				var values = this.getValues();
				return Curve[name](values, _isTime ? location : Curve.getTimeAt(values, location));
			};

			this[name + 'AtTime'] = function (time) {
				return Curve[name](this.getValues(), time);
			};
		}, {
			statics: {
				_evaluateMethods: methods
			}
		});
	}(), new function () {

		function getLengthIntegrand(v) {
			var x0 = v[0],
			    y0 = v[1],
			    x1 = v[2],
			    y1 = v[3],
			    x2 = v[4],
			    y2 = v[5],
			    x3 = v[6],
			    y3 = v[7],
			    ax = 9 * (x1 - x2) + 3 * (x3 - x0),
			    bx = 6 * (x0 + x2) - 12 * x1,
			    cx = 3 * (x1 - x0),
			    ay = 9 * (y1 - y2) + 3 * (y3 - y0),
			    by = 6 * (y0 + y2) - 12 * y1,
			    cy = 3 * (y1 - y0);

			return function (t) {
				var dx = (ax * t + bx) * t + cx,
				    dy = (ay * t + by) * t + cy;
				return Math.sqrt(dx * dx + dy * dy);
			};
		}

		function getIterations(a, b) {
			return Math.max(2, Math.min(16, Math.ceil(Math.abs(b - a) * 32)));
		}

		function evaluate(v, t, type, normalized) {
			if (t == null || t < 0 || t > 1) return null;
			var x0 = v[0],
			    y0 = v[1],
			    x1 = v[2],
			    y1 = v[3],
			    x2 = v[4],
			    y2 = v[5],
			    x3 = v[6],
			    y3 = v[7],
			    isZero = Numerical.isZero;
			if (isZero(x1 - x0) && isZero(y1 - y0)) {
				x1 = x0;
				y1 = y0;
			}
			if (isZero(x2 - x3) && isZero(y2 - y3)) {
				x2 = x3;
				y2 = y3;
			}
			var cx = 3 * (x1 - x0),
			    bx = 3 * (x2 - x1) - cx,
			    ax = x3 - x0 - cx - bx,
			    cy = 3 * (y1 - y0),
			    by = 3 * (y2 - y1) - cy,
			    ay = y3 - y0 - cy - by,
			    x,
			    y;
			if (type === 0) {
				x = t === 0 ? x0 : t === 1 ? x3 : ((ax * t + bx) * t + cx) * t + x0;
				y = t === 0 ? y0 : t === 1 ? y3 : ((ay * t + by) * t + cy) * t + y0;
			} else {
				var tMin = 1e-8,
				    tMax = 1 - tMin;
				if (t < tMin) {
					x = cx;
					y = cy;
				} else if (t > tMax) {
					x = 3 * (x3 - x2);
					y = 3 * (y3 - y2);
				} else {
					x = (3 * ax * t + 2 * bx) * t + cx;
					y = (3 * ay * t + 2 * by) * t + cy;
				}
				if (normalized) {
					if (x === 0 && y === 0 && (t < tMin || t > tMax)) {
						x = x2 - x1;
						y = y2 - y1;
					}
					var len = Math.sqrt(x * x + y * y);
					if (len) {
						x /= len;
						y /= len;
					}
				}
				if (type === 3) {
					var x2 = 6 * ax * t + 2 * bx,
					    y2 = 6 * ay * t + 2 * by,
					    d = Math.pow(x * x + y * y, 3 / 2);
					x = d !== 0 ? (x * y2 - y * x2) / d : 0;
					y = 0;
				}
			}
			return type === 2 ? new Point(y, -x) : new Point(x, y);
		}

		return { statics: {

				classify: function (v) {

					var x0 = v[0],
					    y0 = v[1],
					    x1 = v[2],
					    y1 = v[3],
					    x2 = v[4],
					    y2 = v[5],
					    x3 = v[6],
					    y3 = v[7],
					    a1 = x0 * (y3 - y2) + y0 * (x2 - x3) + x3 * y2 - y3 * x2,
					    a2 = x1 * (y0 - y3) + y1 * (x3 - x0) + x0 * y3 - y0 * x3,
					    a3 = x2 * (y1 - y0) + y2 * (x0 - x1) + x1 * y0 - y1 * x0,
					    d3 = 3 * a3,
					    d2 = d3 - a2,
					    d1 = d2 - a2 + a1,
					    l = Math.sqrt(d1 * d1 + d2 * d2 + d3 * d3),
					    s = l !== 0 ? 1 / l : 0,
					    isZero = Numerical.isZero,
					    serpentine = 'serpentine';
					d1 *= s;
					d2 *= s;
					d3 *= s;

					function type(type, t1, t2) {
						var hasRoots = t1 !== undefined,
						    t1Ok = hasRoots && t1 > 0 && t1 < 1,
						    t2Ok = hasRoots && t2 > 0 && t2 < 1;
						if (hasRoots && (!(t1Ok || t2Ok) || type === 'loop' && !(t1Ok && t2Ok))) {
							type = 'arch';
							t1Ok = t2Ok = false;
						}
						return {
							type: type,
							roots: t1Ok || t2Ok ? t1Ok && t2Ok ? t1 < t2 ? [t1, t2] : [t2, t1] : [t1Ok ? t1 : t2] : null
						};
					}

					if (isZero(d1)) {
						return isZero(d2) ? type(isZero(d3) ? 'line' : 'quadratic') : type(serpentine, d3 / (3 * d2));
					}
					var d = 3 * d2 * d2 - 4 * d1 * d3;
					if (isZero(d)) {
						return type('cusp', d2 / (2 * d1));
					}
					var f1 = d > 0 ? Math.sqrt(d / 3) : Math.sqrt(-d),
					    f2 = 2 * d1;
					return type(d > 0 ? serpentine : 'loop', (d2 + f1) / f2, (d2 - f1) / f2);
				},

				getLength: function (v, a, b, ds) {
					if (a === undefined) a = 0;
					if (b === undefined) b = 1;
					if (Curve.isStraight(v)) {
						var c = v;
						if (b < 1) {
							c = Curve.subdivide(c, b)[0];
							a /= b;
						}
						if (a > 0) {
							c = Curve.subdivide(c, a)[1];
						}
						var dx = c[6] - c[0],
						    dy = c[7] - c[1];
						return Math.sqrt(dx * dx + dy * dy);
					}
					return Numerical.integrate(ds || getLengthIntegrand(v), a, b, getIterations(a, b));
				},

				getTimeAt: function (v, offset, start) {
					if (start === undefined) start = offset < 0 ? 1 : 0;
					if (offset === 0) return start;
					var abs = Math.abs,
					    epsilon = 1e-12,
					    forward = offset > 0,
					    a = forward ? start : 0,
					    b = forward ? 1 : start,
					    ds = getLengthIntegrand(v),
					    rangeLength = Curve.getLength(v, a, b, ds),
					    diff = abs(offset) - rangeLength;
					if (abs(diff) < epsilon) {
						return forward ? b : a;
					} else if (diff > epsilon) {
						return null;
					}
					var guess = offset / rangeLength,
					    length = 0;
					function f(t) {
						length += Numerical.integrate(ds, start, t, getIterations(start, t));
						start = t;
						return length - offset;
					}
					return Numerical.findRoot(f, ds, start + guess, a, b, 32, 1e-12);
				},

				getPoint: function (v, t) {
					return evaluate(v, t, 0, false);
				},

				getTangent: function (v, t) {
					return evaluate(v, t, 1, true);
				},

				getWeightedTangent: function (v, t) {
					return evaluate(v, t, 1, false);
				},

				getNormal: function (v, t) {
					return evaluate(v, t, 2, true);
				},

				getWeightedNormal: function (v, t) {
					return evaluate(v, t, 2, false);
				},

				getCurvature: function (v, t) {
					return evaluate(v, t, 3, false).x;
				},

				getPeaks: function (v) {
					var x0 = v[0],
					    y0 = v[1],
					    x1 = v[2],
					    y1 = v[3],
					    x2 = v[4],
					    y2 = v[5],
					    x3 = v[6],
					    y3 = v[7],
					    ax = -x0 + 3 * x1 - 3 * x2 + x3,
					    bx = 3 * x0 - 6 * x1 + 3 * x2,
					    cx = -3 * x0 + 3 * x1,
					    ay = -y0 + 3 * y1 - 3 * y2 + y3,
					    by = 3 * y0 - 6 * y1 + 3 * y2,
					    cy = -3 * y0 + 3 * y1,
					    tMin = 1e-8,
					    tMax = 1 - tMin,
					    roots = [];
					Numerical.solveCubic(9 * (ax * ax + ay * ay), 9 * (ax * bx + by * ay), 2 * (bx * bx + by * by) + 3 * (cx * ax + cy * ay), cx * bx + by * cy, roots, tMin, tMax);
					return roots.sort();
				}
			} };
	}(), new function () {

		function addLocation(locations, include, c1, t1, p1, c2, t2, p2, overlap) {
			var excludeStart = !overlap && c1.getPrevious() === c2,
			    excludeEnd = !overlap && c1 !== c2 && c1.getNext() === c2,
			    tMin = 1e-8,
			    tMax = 1 - tMin;
			if (t1 == null) t1 = c1.getTimeOf(p1);
			if (t1 !== null && t1 >= (excludeStart ? tMin : 0) && t1 <= (excludeEnd ? tMax : 1)) {
				if (t2 == null) t2 = c2.getTimeOf(p2);
				if (t2 !== null && t2 >= (excludeEnd ? tMin : 0) && t2 <= (excludeStart ? tMax : 1)) {
					var loc1 = new CurveLocation(c1, t1, p1 || c1.getPointAtTime(t1), overlap),
					    loc2 = new CurveLocation(c2, t2, p2 || c2.getPointAtTime(t2), overlap);
					loc1._intersection = loc2;
					loc2._intersection = loc1;
					if (!include || include(loc1)) {
						CurveLocation.insert(locations, loc1, true);
					}
				}
			}
		}

		function addCurveIntersections(v1, v2, c1, c2, locations, include, flip, recursion, calls, tMin, tMax, uMin, uMax) {
			if (++calls >= 4096 || ++recursion >= 40) return calls;
			var fatLineEpsilon = 1e-9,
			    q0x = v2[0],
			    q0y = v2[1],
			    q3x = v2[6],
			    q3y = v2[7],
			    getSignedDistance = Line.getSignedDistance,
			    d1 = getSignedDistance(q0x, q0y, q3x, q3y, v2[2], v2[3]),
			    d2 = getSignedDistance(q0x, q0y, q3x, q3y, v2[4], v2[5]),
			    factor = d1 * d2 > 0 ? 3 / 4 : 4 / 9,
			    dMin = factor * Math.min(0, d1, d2),
			    dMax = factor * Math.max(0, d1, d2),
			    dp0 = getSignedDistance(q0x, q0y, q3x, q3y, v1[0], v1[1]),
			    dp1 = getSignedDistance(q0x, q0y, q3x, q3y, v1[2], v1[3]),
			    dp2 = getSignedDistance(q0x, q0y, q3x, q3y, v1[4], v1[5]),
			    dp3 = getSignedDistance(q0x, q0y, q3x, q3y, v1[6], v1[7]),
			    hull = getConvexHull(dp0, dp1, dp2, dp3),
			    top = hull[0],
			    bottom = hull[1],
			    tMinClip,
			    tMaxClip;
			if (d1 === 0 && d2 === 0 && dp0 === 0 && dp1 === 0 && dp2 === 0 && dp3 === 0 || (tMinClip = clipConvexHull(top, bottom, dMin, dMax)) == null || (tMaxClip = clipConvexHull(top.reverse(), bottom.reverse(), dMin, dMax)) == null) return calls;
			var tMinNew = tMin + (tMax - tMin) * tMinClip,
			    tMaxNew = tMin + (tMax - tMin) * tMaxClip;
			if (Math.max(uMax - uMin, tMaxNew - tMinNew) < fatLineEpsilon) {
				var t = (tMinNew + tMaxNew) / 2,
				    u = (uMin + uMax) / 2;
				addLocation(locations, include, flip ? c2 : c1, flip ? u : t, null, flip ? c1 : c2, flip ? t : u, null);
			} else {
				v1 = Curve.getPart(v1, tMinClip, tMaxClip);
				if (tMaxClip - tMinClip > 0.8) {
					if (tMaxNew - tMinNew > uMax - uMin) {
						var parts = Curve.subdivide(v1, 0.5),
						    t = (tMinNew + tMaxNew) / 2;
						calls = addCurveIntersections(v2, parts[0], c2, c1, locations, include, !flip, recursion, calls, uMin, uMax, tMinNew, t);
						calls = addCurveIntersections(v2, parts[1], c2, c1, locations, include, !flip, recursion, calls, uMin, uMax, t, tMaxNew);
					} else {
						var parts = Curve.subdivide(v2, 0.5),
						    u = (uMin + uMax) / 2;
						calls = addCurveIntersections(parts[0], v1, c2, c1, locations, include, !flip, recursion, calls, uMin, u, tMinNew, tMaxNew);
						calls = addCurveIntersections(parts[1], v1, c2, c1, locations, include, !flip, recursion, calls, u, uMax, tMinNew, tMaxNew);
					}
				} else {
					if (uMax - uMin >= fatLineEpsilon) {
						calls = addCurveIntersections(v2, v1, c2, c1, locations, include, !flip, recursion, calls, uMin, uMax, tMinNew, tMaxNew);
					} else {
						calls = addCurveIntersections(v1, v2, c1, c2, locations, include, flip, recursion, calls, tMinNew, tMaxNew, uMin, uMax);
					}
				}
			}
			return calls;
		}

		function getConvexHull(dq0, dq1, dq2, dq3) {
			var p0 = [0, dq0],
			    p1 = [1 / 3, dq1],
			    p2 = [2 / 3, dq2],
			    p3 = [1, dq3],
			    dist1 = dq1 - (2 * dq0 + dq3) / 3,
			    dist2 = dq2 - (dq0 + 2 * dq3) / 3,
			    hull;
			if (dist1 * dist2 < 0) {
				hull = [[p0, p1, p3], [p0, p2, p3]];
			} else {
				var distRatio = dist1 / dist2;
				hull = [distRatio >= 2 ? [p0, p1, p3] : distRatio <= 0.5 ? [p0, p2, p3] : [p0, p1, p2, p3], [p0, p3]];
			}
			return (dist1 || dist2) < 0 ? hull.reverse() : hull;
		}

		function clipConvexHull(hullTop, hullBottom, dMin, dMax) {
			if (hullTop[0][1] < dMin) {
				return clipConvexHullPart(hullTop, true, dMin);
			} else if (hullBottom[0][1] > dMax) {
				return clipConvexHullPart(hullBottom, false, dMax);
			} else {
				return hullTop[0][0];
			}
		}

		function clipConvexHullPart(part, top, threshold) {
			var px = part[0][0],
			    py = part[0][1];
			for (var i = 1, l = part.length; i < l; i++) {
				var qx = part[i][0],
				    qy = part[i][1];
				if (top ? qy >= threshold : qy <= threshold) {
					return qy === threshold ? qx : px + (threshold - py) * (qx - px) / (qy - py);
				}
				px = qx;
				py = qy;
			}
			return null;
		}

		function getCurveLineIntersections(v, px, py, vx, vy) {
			var isZero = Numerical.isZero;
			if (isZero(vx) && isZero(vy)) {
				var t = Curve.getTimeOf(v, new Point(px, py));
				return t === null ? [] : [t];
			}
			var angle = Math.atan2(-vy, vx),
			    sin = Math.sin(angle),
			    cos = Math.cos(angle),
			    rv = [],
			    roots = [];
			for (var i = 0; i < 8; i += 2) {
				var x = v[i] - px,
				    y = v[i + 1] - py;
				rv.push(x * cos - y * sin, x * sin + y * cos);
			}
			Curve.solveCubic(rv, 1, 0, roots, 0, 1);
			return roots;
		}

		function addCurveLineIntersections(v1, v2, c1, c2, locations, include, flip) {
			var x1 = v2[0],
			    y1 = v2[1],
			    x2 = v2[6],
			    y2 = v2[7],
			    roots = getCurveLineIntersections(v1, x1, y1, x2 - x1, y2 - y1);
			for (var i = 0, l = roots.length; i < l; i++) {
				var t1 = roots[i],
				    p1 = Curve.getPoint(v1, t1),
				    t2 = Curve.getTimeOf(v2, p1);
				if (t2 !== null) {
					var p2 = Curve.getPoint(v2, t2);
					addLocation(locations, include, flip ? c2 : c1, flip ? t2 : t1, flip ? p2 : p1, flip ? c1 : c2, flip ? t1 : t2, flip ? p1 : p2);
				}
			}
		}

		function addLineIntersection(v1, v2, c1, c2, locations, include) {
			var pt = Line.intersect(v1[0], v1[1], v1[6], v1[7], v2[0], v2[1], v2[6], v2[7]);
			if (pt) {
				addLocation(locations, include, c1, null, pt, c2, null, pt);
			}
		}

		function getCurveIntersections(v1, v2, c1, c2, locations, include) {
			var epsilon = 1e-12,
			    min = Math.min,
			    max = Math.max;

			if (max(v1[0], v1[2], v1[4], v1[6]) + epsilon > min(v2[0], v2[2], v2[4], v2[6]) && min(v1[0], v1[2], v1[4], v1[6]) - epsilon < max(v2[0], v2[2], v2[4], v2[6]) && max(v1[1], v1[3], v1[5], v1[7]) + epsilon > min(v2[1], v2[3], v2[5], v2[7]) && min(v1[1], v1[3], v1[5], v1[7]) - epsilon < max(v2[1], v2[3], v2[5], v2[7])) {
				var overlaps = getOverlaps(v1, v2);
				if (overlaps) {
					for (var i = 0; i < 2; i++) {
						var overlap = overlaps[i];
						addLocation(locations, include, c1, overlap[0], null, c2, overlap[1], null, true);
					}
				} else {
					var straight1 = Curve.isStraight(v1),
					    straight2 = Curve.isStraight(v2),
					    straight = straight1 && straight2,
					    flip = straight1 && !straight2;
					(straight ? addLineIntersection : straight1 || straight2 ? addCurveLineIntersections : addCurveIntersections)(flip ? v2 : v1, flip ? v1 : v2, flip ? c2 : c1, flip ? c1 : c2, locations, include, flip, 0, 0, 0, 1, 0, 1);
				}
			}
			return locations;
		}

		function getLoopIntersection(v1, c1, locations, include) {
			var info = Curve.classify(v1);
			if (info.type === 'loop') {
				var roots = info.roots;
				addLocation(locations, include, c1, roots[0], null, c1, roots[1], null);
			}
			return locations;
		}

		function getIntersections(curves1, curves2, include, matrix1, matrix2, _returnFirst) {
			var self = !curves2;
			if (self) curves2 = curves1;
			var length1 = curves1.length,
			    length2 = curves2.length,
			    values2 = [],
			    arrays = [],
			    locations,
			    current;
			for (var i = 0; i < length2; i++) values2[i] = curves2[i].getValues(matrix2);
			for (var i = 0; i < length1; i++) {
				var curve1 = curves1[i],
				    values1 = self ? values2[i] : curve1.getValues(matrix1),
				    path1 = curve1.getPath();
				if (path1 !== current) {
					current = path1;
					locations = [];
					arrays.push(locations);
				}
				if (self) {
					getLoopIntersection(values1, curve1, locations, include);
				}
				for (var j = self ? i + 1 : 0; j < length2; j++) {
					if (_returnFirst && locations.length) return locations;
					getCurveIntersections(values1, values2[j], curve1, curves2[j], locations, include);
				}
			}
			locations = [];
			for (var i = 0, l = arrays.length; i < l; i++) {
				locations.push.apply(locations, arrays[i]);
			}
			return locations;
		}

		function getOverlaps(v1, v2) {

			function getSquaredLineLength(v) {
				var x = v[6] - v[0],
				    y = v[7] - v[1];
				return x * x + y * y;
			}

			var abs = Math.abs,
			    getDistance = Line.getDistance,
			    timeEpsilon = 1e-8,
			    geomEpsilon = 1e-7,
			    straight1 = Curve.isStraight(v1),
			    straight2 = Curve.isStraight(v2),
			    straightBoth = straight1 && straight2,
			    flip = getSquaredLineLength(v1) < getSquaredLineLength(v2),
			    l1 = flip ? v2 : v1,
			    l2 = flip ? v1 : v2,
			    px = l1[0],
			    py = l1[1],
			    vx = l1[6] - px,
			    vy = l1[7] - py;
			if (getDistance(px, py, vx, vy, l2[0], l2[1], true) < geomEpsilon && getDistance(px, py, vx, vy, l2[6], l2[7], true) < geomEpsilon) {
				if (!straightBoth && getDistance(px, py, vx, vy, l1[2], l1[3], true) < geomEpsilon && getDistance(px, py, vx, vy, l1[4], l1[5], true) < geomEpsilon && getDistance(px, py, vx, vy, l2[2], l2[3], true) < geomEpsilon && getDistance(px, py, vx, vy, l2[4], l2[5], true) < geomEpsilon) {
					straight1 = straight2 = straightBoth = true;
				}
			} else if (straightBoth) {
				return null;
			}
			if (straight1 ^ straight2) {
				return null;
			}

			var v = [v1, v2],
			    pairs = [];
			for (var i = 0; i < 4 && pairs.length < 2; i++) {
				var i1 = i & 1,
				    i2 = i1 ^ 1,
				    t1 = i >> 1,
				    t2 = Curve.getTimeOf(v[i1], new Point(v[i2][t1 ? 6 : 0], v[i2][t1 ? 7 : 1]));
				if (t2 != null) {
					var pair = i1 ? [t1, t2] : [t2, t1];
					if (!pairs.length || abs(pair[0] - pairs[0][0]) > timeEpsilon && abs(pair[1] - pairs[0][1]) > timeEpsilon) {
						pairs.push(pair);
					}
				}
				if (i > 2 && !pairs.length) break;
			}
			if (pairs.length !== 2) {
				pairs = null;
			} else if (!straightBoth) {
				var o1 = Curve.getPart(v1, pairs[0][0], pairs[1][0]),
				    o2 = Curve.getPart(v2, pairs[0][1], pairs[1][1]);
				if (abs(o2[2] - o1[2]) > geomEpsilon || abs(o2[3] - o1[3]) > geomEpsilon || abs(o2[4] - o1[4]) > geomEpsilon || abs(o2[5] - o1[5]) > geomEpsilon) pairs = null;
			}
			return pairs;
		}

		return {
			getIntersections: function (curve) {
				var v1 = this.getValues(),
				    v2 = curve && curve !== this && curve.getValues();
				return v2 ? getCurveIntersections(v1, v2, this, curve, []) : getLoopIntersection(v1, this, []);
			},

			statics: {
				getOverlaps: getOverlaps,
				getIntersections: getIntersections,
				getCurveLineIntersections: getCurveLineIntersections
			}
		};
	}());

	var CurveLocation = Base.extend({
		_class: 'CurveLocation',

		initialize: function CurveLocation(curve, time, point, _overlap, _distance) {
			if (time >= 0.99999999) {
				var next = curve.getNext();
				if (next) {
					time = 0;
					curve = next;
				}
			}
			this._setCurve(curve);
			this._time = time;
			this._point = point || curve.getPointAtTime(time);
			this._overlap = _overlap;
			this._distance = _distance;
			this._intersection = this._next = this._previous = null;
		},

		_setCurve: function (curve) {
			var path = curve._path;
			this._path = path;
			this._version = path ? path._version : 0;
			this._curve = curve;
			this._segment = null;
			this._segment1 = curve._segment1;
			this._segment2 = curve._segment2;
		},

		_setSegment: function (segment) {
			this._setCurve(segment.getCurve());
			this._segment = segment;
			this._time = segment === this._segment1 ? 0 : 1;
			this._point = segment._point.clone();
		},

		getSegment: function () {
			var segment = this._segment;
			if (!segment) {
				var curve = this.getCurve(),
				    time = this.getTime();
				if (time === 0) {
					segment = curve._segment1;
				} else if (time === 1) {
					segment = curve._segment2;
				} else if (time != null) {
					segment = curve.getPartLength(0, time) < curve.getPartLength(time, 1) ? curve._segment1 : curve._segment2;
				}
				this._segment = segment;
			}
			return segment;
		},

		getCurve: function () {
			var path = this._path,
			    that = this;
			if (path && path._version !== this._version) {
				this._time = this._offset = this._curveOffset = this._curve = null;
			}

			function trySegment(segment) {
				var curve = segment && segment.getCurve();
				if (curve && (that._time = curve.getTimeOf(that._point)) != null) {
					that._setCurve(curve);
					return curve;
				}
			}

			return this._curve || trySegment(this._segment) || trySegment(this._segment1) || trySegment(this._segment2.getPrevious());
		},

		getPath: function () {
			var curve = this.getCurve();
			return curve && curve._path;
		},

		getIndex: function () {
			var curve = this.getCurve();
			return curve && curve.getIndex();
		},

		getTime: function () {
			var curve = this.getCurve(),
			    time = this._time;
			return curve && time == null ? this._time = curve.getTimeOf(this._point) : time;
		},

		getParameter: '#getTime',

		getPoint: function () {
			return this._point;
		},

		getOffset: function () {
			var offset = this._offset;
			if (offset == null) {
				offset = 0;
				var path = this.getPath(),
				    index = this.getIndex();
				if (path && index != null) {
					var curves = path.getCurves();
					for (var i = 0; i < index; i++) offset += curves[i].getLength();
				}
				this._offset = offset += this.getCurveOffset();
			}
			return offset;
		},

		getCurveOffset: function () {
			var offset = this._curveOffset;
			if (offset == null) {
				var curve = this.getCurve(),
				    time = this.getTime();
				this._curveOffset = offset = time != null && curve && curve.getPartLength(0, time);
			}
			return offset;
		},

		getIntersection: function () {
			return this._intersection;
		},

		getDistance: function () {
			return this._distance;
		},

		divide: function () {
			var curve = this.getCurve(),
			    res = curve && curve.divideAtTime(this.getTime());
			if (res) {
				this._setSegment(res._segment1);
			}
			return res;
		},

		split: function () {
			var curve = this.getCurve(),
			    path = curve._path,
			    res = curve && curve.splitAtTime(this.getTime());
			if (res) {
				this._setSegment(path.getLastSegment());
			}
			return res;
		},

		equals: function (loc, _ignoreOther) {
			var res = this === loc;
			if (!res && loc instanceof CurveLocation) {
				var c1 = this.getCurve(),
				    c2 = loc.getCurve(),
				    p1 = c1._path,
				    p2 = c2._path;
				if (p1 === p2) {
					var abs = Math.abs,
					    epsilon = 1e-7,
					    diff = abs(this.getOffset() - loc.getOffset()),
					    i1 = !_ignoreOther && this._intersection,
					    i2 = !_ignoreOther && loc._intersection;
					res = (diff < epsilon || p1 && abs(p1.getLength() - diff) < epsilon) && (!i1 && !i2 || i1 && i2 && i1.equals(i2, true));
				}
			}
			return res;
		},

		toString: function () {
			var parts = [],
			    point = this.getPoint(),
			    f = Formatter.instance;
			if (point) parts.push('point: ' + point);
			var index = this.getIndex();
			if (index != null) parts.push('index: ' + index);
			var time = this.getTime();
			if (time != null) parts.push('time: ' + f.number(time));
			if (this._distance != null) parts.push('distance: ' + f.number(this._distance));
			return '{ ' + parts.join(', ') + ' }';
		},

		isTouching: function () {
			var inter = this._intersection;
			if (inter && this.getTangent().isCollinear(inter.getTangent())) {
				var curve1 = this.getCurve(),
				    curve2 = inter.getCurve();
				return !(curve1.isStraight() && curve2.isStraight() && curve1.getLine().intersect(curve2.getLine()));
			}
			return false;
		},

		isCrossing: function () {
			var inter = this._intersection;
			if (!inter) return false;
			var t1 = this.getTime(),
			    t2 = inter.getTime(),
			    tMin = 1e-8,
			    tMax = 1 - tMin,
			    t1Inside = t1 >= tMin && t1 <= tMax,
			    t2Inside = t2 >= tMin && t2 <= tMax;
			if (t1Inside && t2Inside) return !this.isTouching();
			var c2 = this.getCurve(),
			    c1 = t1 < tMin ? c2.getPrevious() : c2,
			    c4 = inter.getCurve(),
			    c3 = t2 < tMin ? c4.getPrevious() : c4;
			if (t1 > tMax) c2 = c2.getNext();
			if (t2 > tMax) c4 = c4.getNext();
			if (!c1 || !c2 || !c3 || !c4) return false;

			var offsets = [];

			function addOffsets(curve, end) {
				var v = curve.getValues(),
				    roots = Curve.classify(v).roots || Curve.getPeaks(v),
				    count = roots.length,
				    t = end && count > 1 ? roots[count - 1] : count > 0 ? roots[0] : 0.5;
				offsets.push(Curve.getLength(v, end ? t : 0, end ? 1 : t) / 2);
			}

			function isInRange(angle, min, max) {
				return min < max ? angle > min && angle < max : angle > min || angle < max;
			}

			if (!t1Inside) {
				addOffsets(c1, true);
				addOffsets(c2, false);
			}
			if (!t2Inside) {
				addOffsets(c3, true);
				addOffsets(c4, false);
			}
			var pt = this.getPoint(),
			    offset = Math.min.apply(Math, offsets),
			    v2 = t1Inside ? c2.getTangentAtTime(t1) : c2.getPointAt(offset).subtract(pt),
			    v1 = t1Inside ? v2.negate() : c1.getPointAt(-offset).subtract(pt),
			    v4 = t2Inside ? c4.getTangentAtTime(t2) : c4.getPointAt(offset).subtract(pt),
			    v3 = t2Inside ? v4.negate() : c3.getPointAt(-offset).subtract(pt),
			    a1 = v1.getAngle(),
			    a2 = v2.getAngle(),
			    a3 = v3.getAngle(),
			    a4 = v4.getAngle();
			return !!(t1Inside ? isInRange(a1, a3, a4) ^ isInRange(a2, a3, a4) && isInRange(a1, a4, a3) ^ isInRange(a2, a4, a3) : isInRange(a3, a1, a2) ^ isInRange(a4, a1, a2) && isInRange(a3, a2, a1) ^ isInRange(a4, a2, a1));
		},

		hasOverlap: function () {
			return !!this._overlap;
		}
	}, Base.each(Curve._evaluateMethods, function (name) {
		var get = name + 'At';
		this[name] = function () {
			var curve = this.getCurve(),
			    time = this.getTime();
			return time != null && curve && curve[get](time, true);
		};
	}, {
		preserve: true
	}), new function () {

		function insert(locations, loc, merge) {
			var length = locations.length,
			    l = 0,
			    r = length - 1;

			function search(index, dir) {
				for (var i = index + dir; i >= -1 && i <= length; i += dir) {
					var loc2 = locations[(i % length + length) % length];
					if (!loc.getPoint().isClose(loc2.getPoint(), 1e-7)) break;
					if (loc.equals(loc2)) return loc2;
				}
				return null;
			}

			while (l <= r) {
				var m = l + r >>> 1,
				    loc2 = locations[m],
				    found;
				if (merge && (found = loc.equals(loc2) ? loc2 : search(m, -1) || search(m, 1))) {
					if (loc._overlap) {
						found._overlap = found._intersection._overlap = true;
					}
					return found;
				}
				var path1 = loc.getPath(),
				    path2 = loc2.getPath(),
				    diff = path1 !== path2 ? path1._id - path2._id : loc.getIndex() + loc.getTime() - (loc2.getIndex() + loc2.getTime());
				if (diff < 0) {
					r = m - 1;
				} else {
					l = m + 1;
				}
			}
			locations.splice(l, 0, loc);
			return loc;
		}

		return { statics: {
				insert: insert,

				expand: function (locations) {
					var expanded = locations.slice();
					for (var i = locations.length - 1; i >= 0; i--) {
						insert(expanded, locations[i]._intersection, false);
					}
					return expanded;
				}
			} };
	}());

	var PathItem = Item.extend({
		_class: 'PathItem',
		_selectBounds: false,
		_canScaleStroke: true,
		beans: true,

		initialize: function PathItem() {},

		statics: {
			create: function (arg) {
				var data, segments, compound;
				if (Base.isPlainObject(arg)) {
					segments = arg.segments;
					data = arg.pathData;
				} else if (Array.isArray(arg)) {
					segments = arg;
				} else if (typeof arg === 'string') {
					data = arg;
				}
				if (segments) {
					var first = segments[0];
					compound = first && Array.isArray(first[0]);
				} else if (data) {
					compound = (data.match(/m/gi) || []).length > 1 || /z\s*\S+/i.test(data);
				}
				var ctor = compound ? CompoundPath : Path;
				return new ctor(arg);
			}
		},

		_asPathItem: function () {
			return this;
		},

		isClockwise: function () {
			return this.getArea() >= 0;
		},

		setClockwise: function (clockwise) {
			if (this.isClockwise() != (clockwise = !!clockwise)) this.reverse();
		},

		setPathData: function (data) {

			var parts = data && data.match(/[mlhvcsqtaz][^mlhvcsqtaz]*/ig),
			    coords,
			    relative = false,
			    previous,
			    control,
			    current = new Point(),
			    start = new Point();

			function getCoord(index, coord) {
				var val = +coords[index];
				if (relative) val += current[coord];
				return val;
			}

			function getPoint(index) {
				return new Point(getCoord(index, 'x'), getCoord(index + 1, 'y'));
			}

			this.clear();

			for (var i = 0, l = parts && parts.length; i < l; i++) {
				var part = parts[i],
				    command = part[0],
				    lower = command.toLowerCase();
				coords = part.match(/[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/g);
				var length = coords && coords.length;
				relative = command === lower;
				if (previous === 'z' && !/[mz]/.test(lower)) this.moveTo(current);
				switch (lower) {
					case 'm':
					case 'l':
						var move = lower === 'm';
						for (var j = 0; j < length; j += 2) {
							this[move ? 'moveTo' : 'lineTo'](current = getPoint(j));
							if (move) {
								start = current;
								move = false;
							}
						}
						control = current;
						break;
					case 'h':
					case 'v':
						var coord = lower === 'h' ? 'x' : 'y';
						current = current.clone();
						for (var j = 0; j < length; j++) {
							current[coord] = getCoord(j, coord);
							this.lineTo(current);
						}
						control = current;
						break;
					case 'c':
						for (var j = 0; j < length; j += 6) {
							this.cubicCurveTo(getPoint(j), control = getPoint(j + 2), current = getPoint(j + 4));
						}
						break;
					case 's':
						for (var j = 0; j < length; j += 4) {
							this.cubicCurveTo(/[cs]/.test(previous) ? current.multiply(2).subtract(control) : current, control = getPoint(j), current = getPoint(j + 2));
							previous = lower;
						}
						break;
					case 'q':
						for (var j = 0; j < length; j += 4) {
							this.quadraticCurveTo(control = getPoint(j), current = getPoint(j + 2));
						}
						break;
					case 't':
						for (var j = 0; j < length; j += 2) {
							this.quadraticCurveTo(control = /[qt]/.test(previous) ? current.multiply(2).subtract(control) : current, current = getPoint(j));
							previous = lower;
						}
						break;
					case 'a':
						for (var j = 0; j < length; j += 7) {
							this.arcTo(current = getPoint(j + 5), new Size(+coords[j], +coords[j + 1]), +coords[j + 2], +coords[j + 4], +coords[j + 3]);
						}
						break;
					case 'z':
						this.closePath(1e-12);
						current = start;
						break;
				}
				previous = lower;
			}
		},

		_canComposite: function () {
			return !(this.hasFill() && this.hasStroke());
		},

		_contains: function (point) {
			var winding = point.isInside(this.getBounds({ internal: true, handle: true })) ? this._getWinding(point) : {};
			return winding.onPath || !!(this.getFillRule() === 'evenodd' ? winding.windingL & 1 || winding.windingR & 1 : winding.winding);
		},

		getIntersections: function (path, include, _matrix, _returnFirst) {
			var self = this === path || !path,
			    matrix1 = this._matrix._orNullIfIdentity(),
			    matrix2 = self ? matrix1 : (_matrix || path._matrix)._orNullIfIdentity();
			return self || this.getBounds(matrix1).touches(path.getBounds(matrix2)) ? Curve.getIntersections(this.getCurves(), !self && path.getCurves(), include, matrix1, matrix2, _returnFirst) : [];
		},

		getCrossings: function (path) {
			return this.getIntersections(path, function (inter) {
				return inter.hasOverlap() || inter.isCrossing();
			});
		},

		getNearestLocation: function () {
			var point = Point.read(arguments),
			    curves = this.getCurves(),
			    minDist = Infinity,
			    minLoc = null;
			for (var i = 0, l = curves.length; i < l; i++) {
				var loc = curves[i].getNearestLocation(point);
				if (loc._distance < minDist) {
					minDist = loc._distance;
					minLoc = loc;
				}
			}
			return minLoc;
		},

		getNearestPoint: function () {
			var loc = this.getNearestLocation.apply(this, arguments);
			return loc ? loc.getPoint() : loc;
		},

		interpolate: function (from, to, factor) {
			var isPath = !this._children,
			    name = isPath ? '_segments' : '_children',
			    itemsFrom = from[name],
			    itemsTo = to[name],
			    items = this[name];
			if (!itemsFrom || !itemsTo || itemsFrom.length !== itemsTo.length) {
				throw new Error('Invalid operands in interpolate() call: ' + from + ', ' + to);
			}
			var current = items.length,
			    length = itemsTo.length;
			if (current < length) {
				var ctor = isPath ? Segment : Path;
				for (var i = current; i < length; i++) {
					this.add(new ctor());
				}
			} else if (current > length) {
				this[isPath ? 'removeSegments' : 'removeChildren'](length, current);
			}
			for (var i = 0; i < length; i++) {
				items[i].interpolate(itemsFrom[i], itemsTo[i], factor);
			}
			if (isPath) {
				this.setClosed(from._closed);
				this._changed(9);
			}
		},

		compare: function (path) {
			var ok = false;
			if (path) {
				var paths1 = this._children || [this],
				    paths2 = path._children ? path._children.slice() : [path],
				    length1 = paths1.length,
				    length2 = paths2.length,
				    matched = [],
				    count = 0;
				ok = true;
				for (var i1 = length1 - 1; i1 >= 0 && ok; i1--) {
					var path1 = paths1[i1];
					ok = false;
					for (var i2 = length2 - 1; i2 >= 0 && !ok; i2--) {
						if (path1.compare(paths2[i2])) {
							if (!matched[i2]) {
								matched[i2] = true;
								count++;
							}
							ok = true;
						}
					}
				}
				ok = ok && count === length2;
			}
			return ok;
		}

	});

	var Path = PathItem.extend({
		_class: 'Path',
		_serializeFields: {
			segments: [],
			closed: false
		},

		initialize: function Path(arg) {
			this._closed = false;
			this._segments = [];
			this._version = 0;
			var segments = Array.isArray(arg) ? typeof arg[0] === 'object' ? arg : arguments : arg && arg.size === undefined && (arg.x !== undefined || arg.point !== undefined) ? arguments : null;
			if (segments && segments.length > 0) {
				this.setSegments(segments);
			} else {
				this._curves = undefined;
				this._segmentSelection = 0;
				if (!segments && typeof arg === 'string') {
					this.setPathData(arg);
					arg = null;
				}
			}
			this._initialize(!segments && arg);
		},

		_equals: function (item) {
			return this._closed === item._closed && Base.equals(this._segments, item._segments);
		},

		copyContent: function (source) {
			this.setSegments(source._segments);
			this._closed = source._closed;
		},

		_changed: function _changed(flags) {
			_changed.base.call(this, flags);
			if (flags & 8) {
				this._length = this._area = undefined;
				if (flags & 16) {
					this._version++;
				} else if (this._curves) {
					for (var i = 0, l = this._curves.length; i < l; i++) this._curves[i]._changed();
				}
			} else if (flags & 32) {
				this._bounds = undefined;
			}
		},

		getStyle: function () {
			var parent = this._parent;
			return (parent instanceof CompoundPath ? parent : this)._style;
		},

		getSegments: function () {
			return this._segments;
		},

		setSegments: function (segments) {
			var fullySelected = this.isFullySelected(),
			    length = segments && segments.length;
			this._segments.length = 0;
			this._segmentSelection = 0;
			this._curves = undefined;
			if (length) {
				var last = segments[length - 1];
				if (typeof last === 'boolean') {
					this.setClosed(last);
					length--;
				}
				this._add(Segment.readList(segments, 0, {}, length));
			}
			if (fullySelected) this.setFullySelected(true);
		},

		getFirstSegment: function () {
			return this._segments[0];
		},

		getLastSegment: function () {
			return this._segments[this._segments.length - 1];
		},

		getCurves: function () {
			var curves = this._curves,
			    segments = this._segments;
			if (!curves) {
				var length = this._countCurves();
				curves = this._curves = new Array(length);
				for (var i = 0; i < length; i++) curves[i] = new Curve(this, segments[i], segments[i + 1] || segments[0]);
			}
			return curves;
		},

		getFirstCurve: function () {
			return this.getCurves()[0];
		},

		getLastCurve: function () {
			var curves = this.getCurves();
			return curves[curves.length - 1];
		},

		isClosed: function () {
			return this._closed;
		},

		setClosed: function (closed) {
			if (this._closed != (closed = !!closed)) {
				this._closed = closed;
				if (this._curves) {
					var length = this._curves.length = this._countCurves();
					if (closed) this._curves[length - 1] = new Curve(this, this._segments[length - 1], this._segments[0]);
				}
				this._changed(25);
			}
		}
	}, {
		beans: true,

		getPathData: function (_matrix, _precision) {
			var segments = this._segments,
			    length = segments.length,
			    f = new Formatter(_precision),
			    coords = new Array(6),
			    first = true,
			    curX,
			    curY,
			    prevX,
			    prevY,
			    inX,
			    inY,
			    outX,
			    outY,
			    parts = [];

			function addSegment(segment, skipLine) {
				segment._transformCoordinates(_matrix, coords);
				curX = coords[0];
				curY = coords[1];
				if (first) {
					parts.push('M' + f.pair(curX, curY));
					first = false;
				} else {
					inX = coords[2];
					inY = coords[3];
					if (inX === curX && inY === curY && outX === prevX && outY === prevY) {
						if (!skipLine) {
							var dx = curX - prevX,
							    dy = curY - prevY;
							parts.push(dx === 0 ? 'v' + f.number(dy) : dy === 0 ? 'h' + f.number(dx) : 'l' + f.pair(dx, dy));
						}
					} else {
						parts.push('c' + f.pair(outX - prevX, outY - prevY) + ' ' + f.pair(inX - prevX, inY - prevY) + ' ' + f.pair(curX - prevX, curY - prevY));
					}
				}
				prevX = curX;
				prevY = curY;
				outX = coords[4];
				outY = coords[5];
			}

			if (!length) return '';

			for (var i = 0; i < length; i++) addSegment(segments[i]);
			if (this._closed && length > 0) {
				addSegment(segments[0], true);
				parts.push('z');
			}
			return parts.join('');
		},

		isEmpty: function () {
			return !this._segments.length;
		},

		_transformContent: function (matrix) {
			var segments = this._segments,
			    coords = new Array(6);
			for (var i = 0, l = segments.length; i < l; i++) segments[i]._transformCoordinates(matrix, coords, true);
			return true;
		},

		_add: function (segs, index) {
			var segments = this._segments,
			    curves = this._curves,
			    amount = segs.length,
			    append = index == null,
			    index = append ? segments.length : index;
			for (var i = 0; i < amount; i++) {
				var segment = segs[i];
				if (segment._path) segment = segs[i] = segment.clone();
				segment._path = this;
				segment._index = index + i;
				if (segment._selection) this._updateSelection(segment, 0, segment._selection);
			}
			if (append) {
				segments.push.apply(segments, segs);
			} else {
				segments.splice.apply(segments, [index, 0].concat(segs));
				for (var i = index + amount, l = segments.length; i < l; i++) segments[i]._index = i;
			}
			if (curves) {
				var total = this._countCurves(),
				    start = index > 0 && index + amount - 1 === total ? index - 1 : index,
				    insert = start,
				    end = Math.min(start + amount, total);
				if (segs._curves) {
					curves.splice.apply(curves, [start, 0].concat(segs._curves));
					insert += segs._curves.length;
				}
				for (var i = insert; i < end; i++) curves.splice(i, 0, new Curve(this, null, null));
				this._adjustCurves(start, end);
			}
			this._changed(25);
			return segs;
		},

		_adjustCurves: function (start, end) {
			var segments = this._segments,
			    curves = this._curves,
			    curve;
			for (var i = start; i < end; i++) {
				curve = curves[i];
				curve._path = this;
				curve._segment1 = segments[i];
				curve._segment2 = segments[i + 1] || segments[0];
				curve._changed();
			}
			if (curve = curves[this._closed && !start ? segments.length - 1 : start - 1]) {
				curve._segment2 = segments[start] || segments[0];
				curve._changed();
			}
			if (curve = curves[end]) {
				curve._segment1 = segments[end];
				curve._changed();
			}
		},

		_countCurves: function () {
			var length = this._segments.length;
			return !this._closed && length > 0 ? length - 1 : length;
		},

		add: function (segment1) {
			return arguments.length > 1 && typeof segment1 !== 'number' ? this._add(Segment.readList(arguments)) : this._add([Segment.read(arguments)])[0];
		},

		insert: function (index, segment1) {
			return arguments.length > 2 && typeof segment1 !== 'number' ? this._add(Segment.readList(arguments, 1), index) : this._add([Segment.read(arguments, 1)], index)[0];
		},

		addSegment: function () {
			return this._add([Segment.read(arguments)])[0];
		},

		insertSegment: function (index) {
			return this._add([Segment.read(arguments, 1)], index)[0];
		},

		addSegments: function (segments) {
			return this._add(Segment.readList(segments));
		},

		insertSegments: function (index, segments) {
			return this._add(Segment.readList(segments), index);
		},

		removeSegment: function (index) {
			return this.removeSegments(index, index + 1)[0] || null;
		},

		removeSegments: function (start, end, _includeCurves) {
			start = start || 0;
			end = Base.pick(end, this._segments.length);
			var segments = this._segments,
			    curves = this._curves,
			    count = segments.length,
			    removed = segments.splice(start, end - start),
			    amount = removed.length;
			if (!amount) return removed;
			for (var i = 0; i < amount; i++) {
				var segment = removed[i];
				if (segment._selection) this._updateSelection(segment, segment._selection, 0);
				segment._index = segment._path = null;
			}
			for (var i = start, l = segments.length; i < l; i++) segments[i]._index = i;
			if (curves) {
				var index = start > 0 && end === count + (this._closed ? 1 : 0) ? start - 1 : start,
				    curves = curves.splice(index, amount);
				for (var i = curves.length - 1; i >= 0; i--) curves[i]._path = null;
				if (_includeCurves) removed._curves = curves.slice(1);
				this._adjustCurves(index, index);
			}
			this._changed(25);
			return removed;
		},

		clear: '#removeSegments',

		hasHandles: function () {
			var segments = this._segments;
			for (var i = 0, l = segments.length; i < l; i++) {
				if (segments[i].hasHandles()) return true;
			}
			return false;
		},

		clearHandles: function () {
			var segments = this._segments;
			for (var i = 0, l = segments.length; i < l; i++) segments[i].clearHandles();
		},

		getLength: function () {
			if (this._length == null) {
				var curves = this.getCurves(),
				    length = 0;
				for (var i = 0, l = curves.length; i < l; i++) length += curves[i].getLength();
				this._length = length;
			}
			return this._length;
		},

		getArea: function () {
			var area = this._area;
			if (area == null) {
				var segments = this._segments,
				    closed = this._closed;
				area = 0;
				for (var i = 0, l = segments.length; i < l; i++) {
					var last = i + 1 === l;
					area += Curve.getArea(Curve.getValues(segments[i], segments[last ? 0 : i + 1], null, last && !closed));
				}
				this._area = area;
			}
			return area;
		},

		isFullySelected: function () {
			var length = this._segments.length;
			return this.isSelected() && length > 0 && this._segmentSelection === length * 7;
		},

		setFullySelected: function (selected) {
			if (selected) this._selectSegments(true);
			this.setSelected(selected);
		},

		setSelection: function setSelection(selection) {
			if (!(selection & 1)) this._selectSegments(false);
			setSelection.base.call(this, selection);
		},

		_selectSegments: function (selected) {
			var segments = this._segments,
			    length = segments.length,
			    selection = selected ? 7 : 0;
			this._segmentSelection = selection * length;
			for (var i = 0; i < length; i++) segments[i]._selection = selection;
		},

		_updateSelection: function (segment, oldSelection, newSelection) {
			segment._selection = newSelection;
			var selection = this._segmentSelection += newSelection - oldSelection;
			if (selection > 0) this.setSelected(true);
		},

		divideAt: function (location) {
			var loc = this.getLocationAt(location),
			    curve;
			return loc && (curve = loc.getCurve().divideAt(loc.getCurveOffset())) ? curve._segment1 : null;
		},

		splitAt: function (location) {
			var loc = this.getLocationAt(location),
			    index = loc && loc.index,
			    time = loc && loc.time,
			    tMin = 1e-8,
			    tMax = 1 - tMin;
			if (time > tMax) {
				index++;
				time = 0;
			}
			var curves = this.getCurves();
			if (index >= 0 && index < curves.length) {
				if (time >= tMin) {
					curves[index++].divideAtTime(time);
				}
				var segs = this.removeSegments(index, this._segments.length, true),
				    path;
				if (this._closed) {
					this.setClosed(false);
					path = this;
				} else {
					path = new Path(Item.NO_INSERT);
					path.insertAbove(this);
					path.copyAttributes(this);
				}
				path._add(segs, 0);
				this.addSegment(segs[0]);
				return path;
			}
			return null;
		},

		split: function (index, time) {
			var curve,
			    location = time === undefined ? index : (curve = this.getCurves()[index]) && curve.getLocationAtTime(time);
			return location != null ? this.splitAt(location) : null;
		},

		join: function (path, tolerance) {
			var epsilon = tolerance || 0;
			if (path && path !== this) {
				var segments = path._segments,
				    last1 = this.getLastSegment(),
				    last2 = path.getLastSegment();
				if (!last2) return this;
				if (last1 && last1._point.isClose(last2._point, epsilon)) path.reverse();
				var first2 = path.getFirstSegment();
				if (last1 && last1._point.isClose(first2._point, epsilon)) {
					last1.setHandleOut(first2._handleOut);
					this._add(segments.slice(1));
				} else {
					var first1 = this.getFirstSegment();
					if (first1 && first1._point.isClose(first2._point, epsilon)) path.reverse();
					last2 = path.getLastSegment();
					if (first1 && first1._point.isClose(last2._point, epsilon)) {
						first1.setHandleIn(last2._handleIn);
						this._add(segments.slice(0, segments.length - 1), 0);
					} else {
						this._add(segments.slice());
					}
				}
				if (path._closed) this._add([segments[0]]);
				path.remove();
			}
			var first = this.getFirstSegment(),
			    last = this.getLastSegment();
			if (first !== last && first._point.isClose(last._point, epsilon)) {
				first.setHandleIn(last._handleIn);
				last.remove();
				this.setClosed(true);
			}
			return this;
		},

		reduce: function (options) {
			var curves = this.getCurves(),
			    simplify = options && options.simplify,
			    tolerance = simplify ? 1e-7 : 0;
			for (var i = curves.length - 1; i >= 0; i--) {
				var curve = curves[i];
				if (!curve.hasHandles() && (!curve.hasLength(tolerance) || simplify && curve.isCollinear(curve.getNext()))) curve.remove();
			}
			return this;
		},

		reverse: function () {
			this._segments.reverse();
			for (var i = 0, l = this._segments.length; i < l; i++) {
				var segment = this._segments[i];
				var handleIn = segment._handleIn;
				segment._handleIn = segment._handleOut;
				segment._handleOut = handleIn;
				segment._index = i;
			}
			this._curves = null;
			this._changed(9);
		},

		flatten: function (flatness) {
			var flattener = new PathFlattener(this, flatness || 0.25, 256, true),
			    parts = flattener.parts,
			    length = parts.length,
			    segments = [];
			for (var i = 0; i < length; i++) {
				segments.push(new Segment(parts[i].curve.slice(0, 2)));
			}
			if (!this._closed && length > 0) {
				segments.push(new Segment(parts[length - 1].curve.slice(6)));
			}
			this.setSegments(segments);
		},

		simplify: function (tolerance) {
			var segments = new PathFitter(this).fit(tolerance || 2.5);
			if (segments) this.setSegments(segments);
			return !!segments;
		},

		smooth: function (options) {
			var that = this,
			    opts = options || {},
			    type = opts.type || 'asymmetric',
			    segments = this._segments,
			    length = segments.length,
			    closed = this._closed;

			function getIndex(value, _default) {
				var index = value && value.index;
				if (index != null) {
					var path = value.path;
					if (path && path !== that) throw new Error(value._class + ' ' + index + ' of ' + path + ' is not part of ' + that);
					if (_default && value instanceof Curve) index++;
				} else {
					index = typeof value === 'number' ? value : _default;
				}
				return Math.min(index < 0 && closed ? index % length : index < 0 ? index + length : index, length - 1);
			}

			var loop = closed && opts.from === undefined && opts.to === undefined,
			    from = getIndex(opts.from, 0),
			    to = getIndex(opts.to, length - 1);

			if (from > to) {
				if (closed) {
					from -= length;
				} else {
					var tmp = from;
					from = to;
					to = tmp;
				}
			}
			if (/^(?:asymmetric|continuous)$/.test(type)) {
				var asymmetric = type === 'asymmetric',
				    min = Math.min,
				    amount = to - from + 1,
				    n = amount - 1,
				    padding = loop ? min(amount, 4) : 1,
				    paddingLeft = padding,
				    paddingRight = padding,
				    knots = [];
				if (!closed) {
					paddingLeft = min(1, from);
					paddingRight = min(1, length - to - 1);
				}
				n += paddingLeft + paddingRight;
				if (n <= 1) return;
				for (var i = 0, j = from - paddingLeft; i <= n; i++, j++) {
					knots[i] = segments[(j < 0 ? j + length : j) % length]._point;
				}

				var x = knots[0]._x + 2 * knots[1]._x,
				    y = knots[0]._y + 2 * knots[1]._y,
				    f = 2,
				    n_1 = n - 1,
				    rx = [x],
				    ry = [y],
				    rf = [f],
				    px = [],
				    py = [];
				for (var i = 1; i < n; i++) {
					var internal = i < n_1,
					    a = internal ? 1 : asymmetric ? 1 : 2,
					    b = internal ? 4 : asymmetric ? 2 : 7,
					    u = internal ? 4 : asymmetric ? 3 : 8,
					    v = internal ? 2 : asymmetric ? 0 : 1,
					    m = a / f;
					f = rf[i] = b - m;
					x = rx[i] = u * knots[i]._x + v * knots[i + 1]._x - m * x;
					y = ry[i] = u * knots[i]._y + v * knots[i + 1]._y - m * y;
				}

				px[n_1] = rx[n_1] / rf[n_1];
				py[n_1] = ry[n_1] / rf[n_1];
				for (var i = n - 2; i >= 0; i--) {
					px[i] = (rx[i] - px[i + 1]) / rf[i];
					py[i] = (ry[i] - py[i + 1]) / rf[i];
				}
				px[n] = (3 * knots[n]._x - px[n_1]) / 2;
				py[n] = (3 * knots[n]._y - py[n_1]) / 2;

				for (var i = paddingLeft, max = n - paddingRight, j = from; i <= max; i++, j++) {
					var segment = segments[j < 0 ? j + length : j],
					    pt = segment._point,
					    hx = px[i] - pt._x,
					    hy = py[i] - pt._y;
					if (loop || i < max) segment.setHandleOut(hx, hy);
					if (loop || i > paddingLeft) segment.setHandleIn(-hx, -hy);
				}
			} else {
				for (var i = from; i <= to; i++) {
					segments[i < 0 ? i + length : i].smooth(opts, !loop && i === from, !loop && i === to);
				}
			}
		},

		toShape: function (insert) {
			if (!this._closed) return null;

			var segments = this._segments,
			    type,
			    size,
			    radius,
			    topCenter;

			function isCollinear(i, j) {
				var seg1 = segments[i],
				    seg2 = seg1.getNext(),
				    seg3 = segments[j],
				    seg4 = seg3.getNext();
				return seg1._handleOut.isZero() && seg2._handleIn.isZero() && seg3._handleOut.isZero() && seg4._handleIn.isZero() && seg2._point.subtract(seg1._point).isCollinear(seg4._point.subtract(seg3._point));
			}

			function isOrthogonal(i) {
				var seg2 = segments[i],
				    seg1 = seg2.getPrevious(),
				    seg3 = seg2.getNext();
				return seg1._handleOut.isZero() && seg2._handleIn.isZero() && seg2._handleOut.isZero() && seg3._handleIn.isZero() && seg2._point.subtract(seg1._point).isOrthogonal(seg3._point.subtract(seg2._point));
			}

			function isArc(i) {
				var seg1 = segments[i],
				    seg2 = seg1.getNext(),
				    handle1 = seg1._handleOut,
				    handle2 = seg2._handleIn,
				    kappa = 0.5522847498307936;
				if (handle1.isOrthogonal(handle2)) {
					var pt1 = seg1._point,
					    pt2 = seg2._point,
					    corner = new Line(pt1, handle1, true).intersect(new Line(pt2, handle2, true), true);
					return corner && Numerical.isZero(handle1.getLength() / corner.subtract(pt1).getLength() - kappa) && Numerical.isZero(handle2.getLength() / corner.subtract(pt2).getLength() - kappa);
				}
				return false;
			}

			function getDistance(i, j) {
				return segments[i]._point.getDistance(segments[j]._point);
			}

			if (!this.hasHandles() && segments.length === 4 && isCollinear(0, 2) && isCollinear(1, 3) && isOrthogonal(1)) {
				type = Shape.Rectangle;
				size = new Size(getDistance(0, 3), getDistance(0, 1));
				topCenter = segments[1]._point.add(segments[2]._point).divide(2);
			} else if (segments.length === 8 && isArc(0) && isArc(2) && isArc(4) && isArc(6) && isCollinear(1, 5) && isCollinear(3, 7)) {
				type = Shape.Rectangle;
				size = new Size(getDistance(1, 6), getDistance(0, 3));
				radius = size.subtract(new Size(getDistance(0, 7), getDistance(1, 2))).divide(2);
				topCenter = segments[3]._point.add(segments[4]._point).divide(2);
			} else if (segments.length === 4 && isArc(0) && isArc(1) && isArc(2) && isArc(3)) {
				if (Numerical.isZero(getDistance(0, 2) - getDistance(1, 3))) {
					type = Shape.Circle;
					radius = getDistance(0, 2) / 2;
				} else {
					type = Shape.Ellipse;
					radius = new Size(getDistance(2, 0) / 2, getDistance(3, 1) / 2);
				}
				topCenter = segments[1]._point;
			}

			if (type) {
				var center = this.getPosition(true),
				    shape = new type({
					center: center,
					size: size,
					radius: radius,
					insert: false
				});
				shape.copyAttributes(this, true);
				shape._matrix.prepend(this._matrix);
				shape.rotate(topCenter.subtract(center).getAngle() + 90);
				if (insert === undefined || insert) shape.insertAbove(this);
				return shape;
			}
			return null;
		},

		toPath: '#clone',

		compare: function compare(path) {
			if (!path || path instanceof CompoundPath) return compare.base.call(this, path);
			var curves1 = this.getCurves(),
			    curves2 = path.getCurves(),
			    length1 = curves1.length,
			    length2 = curves2.length;
			if (!length1 || !length2) {
				return length1 == length2;
			}
			var v1 = curves1[0].getValues(),
			    values2 = [],
			    pos1 = 0,
			    pos2,
			    end1 = 0,
			    end2;
			for (var i = 0; i < length2; i++) {
				var v2 = curves2[i].getValues();
				values2.push(v2);
				var overlaps = Curve.getOverlaps(v1, v2);
				if (overlaps) {
					pos2 = !i && overlaps[0][0] > 0 ? length2 - 1 : i;
					end2 = overlaps[0][1];
					break;
				}
			}
			var abs = Math.abs,
			    epsilon = 1e-8,
			    v2 = values2[pos2],
			    start2;
			while (v1 && v2) {
				var overlaps = Curve.getOverlaps(v1, v2);
				if (overlaps) {
					var t1 = overlaps[0][0];
					if (abs(t1 - end1) < epsilon) {
						end1 = overlaps[1][0];
						if (end1 === 1) {
							v1 = ++pos1 < length1 ? curves1[pos1].getValues() : null;
							end1 = 0;
						}
						var t2 = overlaps[0][1];
						if (abs(t2 - end2) < epsilon) {
							if (!start2) start2 = [pos2, t2];
							end2 = overlaps[1][1];
							if (end2 === 1) {
								if (++pos2 >= length2) pos2 = 0;
								v2 = values2[pos2] || curves2[pos2].getValues();
								end2 = 0;
							}
							if (!v1) {
								return start2[0] === pos2 && start2[1] === end2;
							}
							continue;
						}
					}
				}
				break;
			}
			return false;
		},

		_hitTestSelf: function (point, options, viewMatrix, strokeMatrix) {
			var that = this,
			    style = this.getStyle(),
			    segments = this._segments,
			    numSegments = segments.length,
			    closed = this._closed,
			    tolerancePadding = options._tolerancePadding,
			    strokePadding = tolerancePadding,
			    join,
			    cap,
			    miterLimit,
			    area,
			    loc,
			    res,
			    hitStroke = options.stroke && style.hasStroke(),
			    hitFill = options.fill && style.hasFill(),
			    hitCurves = options.curves,
			    strokeRadius = hitStroke ? style.getStrokeWidth() / 2 : hitFill && options.tolerance > 0 || hitCurves ? 0 : null;
			if (strokeRadius !== null) {
				if (strokeRadius > 0) {
					join = style.getStrokeJoin();
					cap = style.getStrokeCap();
					miterLimit = style.getMiterLimit();
					strokePadding = strokePadding.add(Path._getStrokePadding(strokeRadius, strokeMatrix));
				} else {
					join = cap = 'round';
				}
			}

			function isCloseEnough(pt, padding) {
				return point.subtract(pt).divide(padding).length <= 1;
			}

			function checkSegmentPoint(seg, pt, name) {
				if (!options.selected || pt.isSelected()) {
					var anchor = seg._point;
					if (pt !== anchor) pt = pt.add(anchor);
					if (isCloseEnough(pt, strokePadding)) {
						return new HitResult(name, that, {
							segment: seg,
							point: pt
						});
					}
				}
			}

			function checkSegmentPoints(seg, ends) {
				return (ends || options.segments) && checkSegmentPoint(seg, seg._point, 'segment') || !ends && options.handles && (checkSegmentPoint(seg, seg._handleIn, 'handle-in') || checkSegmentPoint(seg, seg._handleOut, 'handle-out'));
			}

			function addToArea(point) {
				area.add(point);
			}

			function checkSegmentStroke(segment) {
				var isJoin = closed || segment._index > 0 && segment._index < numSegments - 1;
				if ((isJoin ? join : cap) === 'round') {
					return isCloseEnough(segment._point, strokePadding);
				} else {
					area = new Path({ internal: true, closed: true });
					if (isJoin) {
						if (!segment.isSmooth()) {
							Path._addBevelJoin(segment, join, strokeRadius, miterLimit, null, strokeMatrix, addToArea, true);
						}
					} else if (cap === 'square') {
						Path._addSquareCap(segment, cap, strokeRadius, null, strokeMatrix, addToArea, true);
					}
					if (!area.isEmpty()) {
						var loc;
						return area.contains(point) || (loc = area.getNearestLocation(point)) && isCloseEnough(loc.getPoint(), tolerancePadding);
					}
				}
			}

			if (options.ends && !options.segments && !closed) {
				if (res = checkSegmentPoints(segments[0], true) || checkSegmentPoints(segments[numSegments - 1], true)) return res;
			} else if (options.segments || options.handles) {
				for (var i = 0; i < numSegments; i++) if (res = checkSegmentPoints(segments[i])) return res;
			}
			if (strokeRadius !== null) {
				loc = this.getNearestLocation(point);
				if (loc) {
					var time = loc.getTime();
					if (time === 0 || time === 1 && numSegments > 1) {
						if (!checkSegmentStroke(loc.getSegment())) loc = null;
					} else if (!isCloseEnough(loc.getPoint(), strokePadding)) {
						loc = null;
					}
				}
				if (!loc && join === 'miter' && numSegments > 1) {
					for (var i = 0; i < numSegments; i++) {
						var segment = segments[i];
						if (point.getDistance(segment._point) <= miterLimit * strokeRadius && checkSegmentStroke(segment)) {
							loc = segment.getLocation();
							break;
						}
					}
				}
			}
			return !loc && hitFill && this._contains(point) || loc && !hitStroke && !hitCurves ? new HitResult('fill', this) : loc ? new HitResult(hitStroke ? 'stroke' : 'curve', this, {
				location: loc,
				point: loc.getPoint()
			}) : null;
		}

	}, Base.each(Curve._evaluateMethods, function (name) {
		this[name + 'At'] = function (offset) {
			var loc = this.getLocationAt(offset);
			return loc && loc[name]();
		};
	}, {
		beans: false,

		getLocationOf: function () {
			var point = Point.read(arguments),
			    curves = this.getCurves();
			for (var i = 0, l = curves.length; i < l; i++) {
				var loc = curves[i].getLocationOf(point);
				if (loc) return loc;
			}
			return null;
		},

		getOffsetOf: function () {
			var loc = this.getLocationOf.apply(this, arguments);
			return loc ? loc.getOffset() : null;
		},

		getLocationAt: function (offset) {
			if (typeof offset === 'number') {
				var curves = this.getCurves(),
				    length = 0;
				for (var i = 0, l = curves.length; i < l; i++) {
					var start = length,
					    curve = curves[i];
					length += curve.getLength();
					if (length > offset) {
						return curve.getLocationAt(offset - start);
					}
				}
				if (curves.length > 0 && offset <= this.getLength()) {
					return new CurveLocation(curves[curves.length - 1], 1);
				}
			} else if (offset && offset.getPath && offset.getPath() === this) {
				return offset;
			}
			return null;
		}

	}), new function () {

		function drawHandles(ctx, segments, matrix, size) {
			var half = size / 2,
			    coords = new Array(6),
			    pX,
			    pY;

			function drawHandle(index) {
				var hX = coords[index],
				    hY = coords[index + 1];
				if (pX != hX || pY != hY) {
					ctx.beginPath();
					ctx.moveTo(pX, pY);
					ctx.lineTo(hX, hY);
					ctx.stroke();
					ctx.beginPath();
					ctx.arc(hX, hY, half, 0, Math.PI * 2, true);
					ctx.fill();
				}
			}

			for (var i = 0, l = segments.length; i < l; i++) {
				var segment = segments[i],
				    selection = segment._selection;
				segment._transformCoordinates(matrix, coords);
				pX = coords[0];
				pY = coords[1];
				if (selection & 2) drawHandle(2);
				if (selection & 4) drawHandle(4);
				ctx.fillRect(pX - half, pY - half, size, size);
				if (!(selection & 1)) {
					var fillStyle = ctx.fillStyle;
					ctx.fillStyle = '#ffffff';
					ctx.fillRect(pX - half + 1, pY - half + 1, size - 2, size - 2);
					ctx.fillStyle = fillStyle;
				}
			}
		}

		function drawSegments(ctx, path, matrix) {
			var segments = path._segments,
			    length = segments.length,
			    coords = new Array(6),
			    first = true,
			    curX,
			    curY,
			    prevX,
			    prevY,
			    inX,
			    inY,
			    outX,
			    outY;

			function drawSegment(segment) {
				if (matrix) {
					segment._transformCoordinates(matrix, coords);
					curX = coords[0];
					curY = coords[1];
				} else {
					var point = segment._point;
					curX = point._x;
					curY = point._y;
				}
				if (first) {
					ctx.moveTo(curX, curY);
					first = false;
				} else {
					if (matrix) {
						inX = coords[2];
						inY = coords[3];
					} else {
						var handle = segment._handleIn;
						inX = curX + handle._x;
						inY = curY + handle._y;
					}
					if (inX === curX && inY === curY && outX === prevX && outY === prevY) {
						ctx.lineTo(curX, curY);
					} else {
						ctx.bezierCurveTo(outX, outY, inX, inY, curX, curY);
					}
				}
				prevX = curX;
				prevY = curY;
				if (matrix) {
					outX = coords[4];
					outY = coords[5];
				} else {
					var handle = segment._handleOut;
					outX = prevX + handle._x;
					outY = prevY + handle._y;
				}
			}

			for (var i = 0; i < length; i++) drawSegment(segments[i]);
			if (path._closed && length > 0) drawSegment(segments[0]);
		}

		return {
			_draw: function (ctx, param, viewMatrix, strokeMatrix) {
				var dontStart = param.dontStart,
				    dontPaint = param.dontFinish || param.clip,
				    style = this.getStyle(),
				    hasFill = style.hasFill(),
				    hasStroke = style.hasStroke(),
				    dashArray = style.getDashArray(),
				    dashLength = !paper.support.nativeDash && hasStroke && dashArray && dashArray.length;

				if (!dontStart) ctx.beginPath();

				if (hasFill || hasStroke && !dashLength || dontPaint) {
					drawSegments(ctx, this, strokeMatrix);
					if (this._closed) ctx.closePath();
				}

				function getOffset(i) {
					return dashArray[(i % dashLength + dashLength) % dashLength];
				}

				if (!dontPaint && (hasFill || hasStroke)) {
					this._setStyles(ctx, param, viewMatrix);
					if (hasFill) {
						ctx.fill(style.getFillRule());
						ctx.shadowColor = 'rgba(0,0,0,0)';
					}
					if (hasStroke) {
						if (dashLength) {
							if (!dontStart) ctx.beginPath();
							var flattener = new PathFlattener(this, 0.25, 32, false, strokeMatrix),
							    length = flattener.length,
							    from = -style.getDashOffset(),
							    to,
							    i = 0;
							from = from % length;
							while (from > 0) {
								from -= getOffset(i--) + getOffset(i--);
							}
							while (from < length) {
								to = from + getOffset(i++);
								if (from > 0 || to > 0) flattener.drawPart(ctx, Math.max(from, 0), Math.max(to, 0));
								from = to + getOffset(i++);
							}
						}
						ctx.stroke();
					}
				}
			},

			_drawSelected: function (ctx, matrix) {
				ctx.beginPath();
				drawSegments(ctx, this, matrix);
				ctx.stroke();
				drawHandles(ctx, this._segments, matrix, paper.settings.handleSize);
			}
		};
	}(), new function () {
		function getCurrentSegment(that) {
			var segments = that._segments;
			if (!segments.length) throw new Error('Use a moveTo() command first');
			return segments[segments.length - 1];
		}

		return {
			moveTo: function () {
				var segments = this._segments;
				if (segments.length === 1) this.removeSegment(0);
				if (!segments.length) this._add([new Segment(Point.read(arguments))]);
			},

			moveBy: function () {
				throw new Error('moveBy() is unsupported on Path items.');
			},

			lineTo: function () {
				this._add([new Segment(Point.read(arguments))]);
			},

			cubicCurveTo: function () {
				var handle1 = Point.read(arguments),
				    handle2 = Point.read(arguments),
				    to = Point.read(arguments),
				    current = getCurrentSegment(this);
				current.setHandleOut(handle1.subtract(current._point));
				this._add([new Segment(to, handle2.subtract(to))]);
			},

			quadraticCurveTo: function () {
				var handle = Point.read(arguments),
				    to = Point.read(arguments),
				    current = getCurrentSegment(this)._point;
				this.cubicCurveTo(handle.add(current.subtract(handle).multiply(1 / 3)), handle.add(to.subtract(handle).multiply(1 / 3)), to);
			},

			curveTo: function () {
				var through = Point.read(arguments),
				    to = Point.read(arguments),
				    t = Base.pick(Base.read(arguments), 0.5),
				    t1 = 1 - t,
				    current = getCurrentSegment(this)._point,
				    handle = through.subtract(current.multiply(t1 * t1)).subtract(to.multiply(t * t)).divide(2 * t * t1);
				if (handle.isNaN()) throw new Error('Cannot put a curve through points with parameter = ' + t);
				this.quadraticCurveTo(handle, to);
			},

			arcTo: function () {
				var abs = Math.abs,
				    sqrt = Math.sqrt,
				    current = getCurrentSegment(this),
				    from = current._point,
				    to = Point.read(arguments),
				    through,
				    peek = Base.peek(arguments),
				    clockwise = Base.pick(peek, true),
				    center,
				    extent,
				    vector,
				    matrix;
				if (typeof clockwise === 'boolean') {
					var middle = from.add(to).divide(2),
					    through = middle.add(middle.subtract(from).rotate(clockwise ? -90 : 90));
				} else if (Base.remain(arguments) <= 2) {
					through = to;
					to = Point.read(arguments);
				} else {
					var radius = Size.read(arguments),
					    isZero = Numerical.isZero;
					if (isZero(radius.width) || isZero(radius.height)) return this.lineTo(to);
					var rotation = Base.read(arguments),
					    clockwise = !!Base.read(arguments),
					    large = !!Base.read(arguments),
					    middle = from.add(to).divide(2),
					    pt = from.subtract(middle).rotate(-rotation),
					    x = pt.x,
					    y = pt.y,
					    rx = abs(radius.width),
					    ry = abs(radius.height),
					    rxSq = rx * rx,
					    rySq = ry * ry,
					    xSq = x * x,
					    ySq = y * y;
					var factor = sqrt(xSq / rxSq + ySq / rySq);
					if (factor > 1) {
						rx *= factor;
						ry *= factor;
						rxSq = rx * rx;
						rySq = ry * ry;
					}
					factor = (rxSq * rySq - rxSq * ySq - rySq * xSq) / (rxSq * ySq + rySq * xSq);
					if (abs(factor) < 1e-12) factor = 0;
					if (factor < 0) throw new Error('Cannot create an arc with the given arguments');
					center = new Point(rx * y / ry, -ry * x / rx).multiply((large === clockwise ? -1 : 1) * sqrt(factor)).rotate(rotation).add(middle);
					matrix = new Matrix().translate(center).rotate(rotation).scale(rx, ry);
					vector = matrix._inverseTransform(from);
					extent = vector.getDirectedAngle(matrix._inverseTransform(to));
					if (!clockwise && extent > 0) extent -= 360;else if (clockwise && extent < 0) extent += 360;
				}
				if (through) {
					var l1 = new Line(from.add(through).divide(2), through.subtract(from).rotate(90), true),
					    l2 = new Line(through.add(to).divide(2), to.subtract(through).rotate(90), true),
					    line = new Line(from, to),
					    throughSide = line.getSide(through);
					center = l1.intersect(l2, true);
					if (!center) {
						if (!throughSide) return this.lineTo(to);
						throw new Error('Cannot create an arc with the given arguments');
					}
					vector = from.subtract(center);
					extent = vector.getDirectedAngle(to.subtract(center));
					var centerSide = line.getSide(center);
					if (centerSide === 0) {
						extent = throughSide * abs(extent);
					} else if (throughSide === centerSide) {
						extent += extent < 0 ? 360 : -360;
					}
				}
				var epsilon = 1e-12,
				    ext = abs(extent),
				    count = ext >= 360 ? 4 : Math.ceil((ext - epsilon) / 90),
				    inc = extent / count,
				    half = inc * Math.PI / 360,
				    z = 4 / 3 * Math.sin(half) / (1 + Math.cos(half)),
				    segments = [];
				for (var i = 0; i <= count; i++) {
					var pt = to,
					    out = null;
					if (i < count) {
						out = vector.rotate(90).multiply(z);
						if (matrix) {
							pt = matrix._transformPoint(vector);
							out = matrix._transformPoint(vector.add(out)).subtract(pt);
						} else {
							pt = center.add(vector);
						}
					}
					if (!i) {
						current.setHandleOut(out);
					} else {
						var _in = vector.rotate(-90).multiply(z);
						if (matrix) {
							_in = matrix._transformPoint(vector.add(_in)).subtract(pt);
						}
						segments.push(new Segment(pt, _in, out));
					}
					vector = vector.rotate(inc);
				}
				this._add(segments);
			},

			lineBy: function () {
				var to = Point.read(arguments),
				    current = getCurrentSegment(this)._point;
				this.lineTo(current.add(to));
			},

			curveBy: function () {
				var through = Point.read(arguments),
				    to = Point.read(arguments),
				    parameter = Base.read(arguments),
				    current = getCurrentSegment(this)._point;
				this.curveTo(current.add(through), current.add(to), parameter);
			},

			cubicCurveBy: function () {
				var handle1 = Point.read(arguments),
				    handle2 = Point.read(arguments),
				    to = Point.read(arguments),
				    current = getCurrentSegment(this)._point;
				this.cubicCurveTo(current.add(handle1), current.add(handle2), current.add(to));
			},

			quadraticCurveBy: function () {
				var handle = Point.read(arguments),
				    to = Point.read(arguments),
				    current = getCurrentSegment(this)._point;
				this.quadraticCurveTo(current.add(handle), current.add(to));
			},

			arcBy: function () {
				var current = getCurrentSegment(this)._point,
				    point = current.add(Point.read(arguments)),
				    clockwise = Base.pick(Base.peek(arguments), true);
				if (typeof clockwise === 'boolean') {
					this.arcTo(point, clockwise);
				} else {
					this.arcTo(point, current.add(Point.read(arguments)));
				}
			},

			closePath: function (tolerance) {
				this.setClosed(true);
				this.join(this, tolerance);
			}
		};
	}(), {

		_getBounds: function (matrix, options) {
			var method = options.handle ? 'getHandleBounds' : options.stroke ? 'getStrokeBounds' : 'getBounds';
			return Path[method](this._segments, this._closed, this, matrix, options);
		},

		statics: {
			getBounds: function (segments, closed, path, matrix, options, strokePadding) {
				var first = segments[0];
				if (!first) return new Rectangle();
				var coords = new Array(6),
				    prevCoords = first._transformCoordinates(matrix, new Array(6)),
				    min = prevCoords.slice(0, 2),
				    max = min.slice(),
				    roots = new Array(2);

				function processSegment(segment) {
					segment._transformCoordinates(matrix, coords);
					for (var i = 0; i < 2; i++) {
						Curve._addBounds(prevCoords[i], prevCoords[i + 4], coords[i + 2], coords[i], i, strokePadding ? strokePadding[i] : 0, min, max, roots);
					}
					var tmp = prevCoords;
					prevCoords = coords;
					coords = tmp;
				}

				for (var i = 1, l = segments.length; i < l; i++) processSegment(segments[i]);
				if (closed) processSegment(first);
				return new Rectangle(min[0], min[1], max[0] - min[0], max[1] - min[1]);
			},

			getStrokeBounds: function (segments, closed, path, matrix, options) {
				var style = path.getStyle(),
				    stroke = style.hasStroke(),
				    strokeWidth = style.getStrokeWidth(),
				    strokeMatrix = stroke && path._getStrokeMatrix(matrix, options),
				    strokePadding = stroke && Path._getStrokePadding(strokeWidth, strokeMatrix),
				    bounds = Path.getBounds(segments, closed, path, matrix, options, strokePadding);
				if (!stroke) return bounds;
				var strokeRadius = strokeWidth / 2,
				    join = style.getStrokeJoin(),
				    cap = style.getStrokeCap(),
				    miterLimit = style.getMiterLimit(),
				    joinBounds = new Rectangle(new Size(strokePadding));

				function addPoint(point) {
					bounds = bounds.include(point);
				}

				function addRound(segment) {
					bounds = bounds.unite(joinBounds.setCenter(segment._point.transform(matrix)));
				}

				function addJoin(segment, join) {
					if (join === 'round' || segment.isSmooth()) {
						addRound(segment);
					} else {
						Path._addBevelJoin(segment, join, strokeRadius, miterLimit, matrix, strokeMatrix, addPoint);
					}
				}

				function addCap(segment, cap) {
					if (cap === 'round') {
						addRound(segment);
					} else {
						Path._addSquareCap(segment, cap, strokeRadius, matrix, strokeMatrix, addPoint);
					}
				}

				var length = segments.length - (closed ? 0 : 1);
				for (var i = 1; i < length; i++) addJoin(segments[i], join);
				if (closed) {
					addJoin(segments[0], join);
				} else if (length > 0) {
					addCap(segments[0], cap);
					addCap(segments[segments.length - 1], cap);
				}
				return bounds;
			},

			_getStrokePadding: function (radius, matrix) {
				if (!matrix) return [radius, radius];
				var hor = new Point(radius, 0).transform(matrix),
				    ver = new Point(0, radius).transform(matrix),
				    phi = hor.getAngleInRadians(),
				    a = hor.getLength(),
				    b = ver.getLength();
				var sin = Math.sin(phi),
				    cos = Math.cos(phi),
				    tan = Math.tan(phi),
				    tx = Math.atan2(b * tan, a),
				    ty = Math.atan2(b, tan * a);
				return [Math.abs(a * Math.cos(tx) * cos + b * Math.sin(tx) * sin), Math.abs(b * Math.sin(ty) * cos + a * Math.cos(ty) * sin)];
			},

			_addBevelJoin: function (segment, join, radius, miterLimit, matrix, strokeMatrix, addPoint, isArea) {
				var curve2 = segment.getCurve(),
				    curve1 = curve2.getPrevious(),
				    point = curve2.getPoint1().transform(matrix),
				    normal1 = curve1.getNormalAtTime(1).multiply(radius).transform(strokeMatrix),
				    normal2 = curve2.getNormalAtTime(0).multiply(radius).transform(strokeMatrix);
				if (normal1.getDirectedAngle(normal2) < 0) {
					normal1 = normal1.negate();
					normal2 = normal2.negate();
				}
				if (isArea) addPoint(point);
				addPoint(point.add(normal1));
				if (join === 'miter') {
					var corner = new Line(point.add(normal1), new Point(-normal1.y, normal1.x), true).intersect(new Line(point.add(normal2), new Point(-normal2.y, normal2.x), true), true);
					if (corner && point.getDistance(corner) <= miterLimit * radius) {
						addPoint(corner);
					}
				}
				addPoint(point.add(normal2));
			},

			_addSquareCap: function (segment, cap, radius, matrix, strokeMatrix, addPoint, isArea) {
				var point = segment._point.transform(matrix),
				    loc = segment.getLocation(),
				    normal = loc.getNormal().multiply(radius).transform(strokeMatrix);
				if (cap === 'square') {
					if (isArea) {
						addPoint(point.subtract(normal));
						addPoint(point.add(normal));
					}
					point = point.add(normal.rotate(loc.getTime() === 0 ? -90 : 90));
				}
				addPoint(point.add(normal));
				addPoint(point.subtract(normal));
			},

			getHandleBounds: function (segments, closed, path, matrix, options) {
				var style = path.getStyle(),
				    stroke = options.stroke && style.hasStroke(),
				    strokePadding,
				    joinPadding;
				if (stroke) {
					var strokeMatrix = path._getStrokeMatrix(matrix, options),
					    strokeRadius = style.getStrokeWidth() / 2,
					    joinRadius = strokeRadius;
					if (style.getStrokeJoin() === 'miter') joinRadius = strokeRadius * style.getMiterLimit();
					if (style.getStrokeCap() === 'square') joinRadius = Math.max(joinRadius, strokeRadius * Math.SQRT2);
					strokePadding = Path._getStrokePadding(strokeRadius, strokeMatrix);
					joinPadding = Path._getStrokePadding(joinRadius, strokeMatrix);
				}
				var coords = new Array(6),
				    x1 = Infinity,
				    x2 = -x1,
				    y1 = x1,
				    y2 = x2;
				for (var i = 0, l = segments.length; i < l; i++) {
					var segment = segments[i];
					segment._transformCoordinates(matrix, coords);
					for (var j = 0; j < 6; j += 2) {
						var padding = !j ? joinPadding : strokePadding,
						    paddingX = padding ? padding[0] : 0,
						    paddingY = padding ? padding[1] : 0,
						    x = coords[j],
						    y = coords[j + 1],
						    xn = x - paddingX,
						    xx = x + paddingX,
						    yn = y - paddingY,
						    yx = y + paddingY;
						if (xn < x1) x1 = xn;
						if (xx > x2) x2 = xx;
						if (yn < y1) y1 = yn;
						if (yx > y2) y2 = yx;
					}
				}
				return new Rectangle(x1, y1, x2 - x1, y2 - y1);
			}
		} });

	Path.inject({ statics: new function () {

			var kappa = 0.5522847498307936,
			    ellipseSegments = [new Segment([-1, 0], [0, kappa], [0, -kappa]), new Segment([0, -1], [-kappa, 0], [kappa, 0]), new Segment([1, 0], [0, -kappa], [0, kappa]), new Segment([0, 1], [kappa, 0], [-kappa, 0])];

			function createPath(segments, closed, args) {
				var props = Base.getNamed(args),
				    path = new Path(props && props.insert === false && Item.NO_INSERT);
				path._add(segments);
				path._closed = closed;
				return path.set(props);
			}

			function createEllipse(center, radius, args) {
				var segments = new Array(4);
				for (var i = 0; i < 4; i++) {
					var segment = ellipseSegments[i];
					segments[i] = new Segment(segment._point.multiply(radius).add(center), segment._handleIn.multiply(radius), segment._handleOut.multiply(radius));
				}
				return createPath(segments, true, args);
			}

			return {
				Line: function () {
					return createPath([new Segment(Point.readNamed(arguments, 'from')), new Segment(Point.readNamed(arguments, 'to'))], false, arguments);
				},

				Circle: function () {
					var center = Point.readNamed(arguments, 'center'),
					    radius = Base.readNamed(arguments, 'radius');
					return createEllipse(center, new Size(radius), arguments);
				},

				Rectangle: function () {
					var rect = Rectangle.readNamed(arguments, 'rectangle'),
					    radius = Size.readNamed(arguments, 'radius', 0, { readNull: true }),
					    bl = rect.getBottomLeft(true),
					    tl = rect.getTopLeft(true),
					    tr = rect.getTopRight(true),
					    br = rect.getBottomRight(true),
					    segments;
					if (!radius || radius.isZero()) {
						segments = [new Segment(bl), new Segment(tl), new Segment(tr), new Segment(br)];
					} else {
						radius = Size.min(radius, rect.getSize(true).divide(2));
						var rx = radius.width,
						    ry = radius.height,
						    hx = rx * kappa,
						    hy = ry * kappa;
						segments = [new Segment(bl.add(rx, 0), null, [-hx, 0]), new Segment(bl.subtract(0, ry), [0, hy]), new Segment(tl.add(0, ry), null, [0, -hy]), new Segment(tl.add(rx, 0), [-hx, 0], null), new Segment(tr.subtract(rx, 0), null, [hx, 0]), new Segment(tr.add(0, ry), [0, -hy], null), new Segment(br.subtract(0, ry), null, [0, hy]), new Segment(br.subtract(rx, 0), [hx, 0])];
					}
					return createPath(segments, true, arguments);
				},

				RoundRectangle: '#Rectangle',

				Ellipse: function () {
					var ellipse = Shape._readEllipse(arguments);
					return createEllipse(ellipse.center, ellipse.radius, arguments);
				},

				Oval: '#Ellipse',

				Arc: function () {
					var from = Point.readNamed(arguments, 'from'),
					    through = Point.readNamed(arguments, 'through'),
					    to = Point.readNamed(arguments, 'to'),
					    props = Base.getNamed(arguments),
					    path = new Path(props && props.insert === false && Item.NO_INSERT);
					path.moveTo(from);
					path.arcTo(through, to);
					return path.set(props);
				},

				RegularPolygon: function () {
					var center = Point.readNamed(arguments, 'center'),
					    sides = Base.readNamed(arguments, 'sides'),
					    radius = Base.readNamed(arguments, 'radius'),
					    step = 360 / sides,
					    three = sides % 3 === 0,
					    vector = new Point(0, three ? -radius : radius),
					    offset = three ? -1 : 0.5,
					    segments = new Array(sides);
					for (var i = 0; i < sides; i++) segments[i] = new Segment(center.add(vector.rotate((i + offset) * step)));
					return createPath(segments, true, arguments);
				},

				Star: function () {
					var center = Point.readNamed(arguments, 'center'),
					    points = Base.readNamed(arguments, 'points') * 2,
					    radius1 = Base.readNamed(arguments, 'radius1'),
					    radius2 = Base.readNamed(arguments, 'radius2'),
					    step = 360 / points,
					    vector = new Point(0, -1),
					    segments = new Array(points);
					for (var i = 0; i < points; i++) segments[i] = new Segment(center.add(vector.rotate(step * i).multiply(i % 2 ? radius2 : radius1)));
					return createPath(segments, true, arguments);
				}
			};
		}() });

	var CompoundPath = PathItem.extend({
		_class: 'CompoundPath',
		_serializeFields: {
			children: []
		},
		beans: true,

		initialize: function CompoundPath(arg) {
			this._children = [];
			this._namedChildren = {};
			if (!this._initialize(arg)) {
				if (typeof arg === 'string') {
					this.setPathData(arg);
				} else {
					this.addChildren(Array.isArray(arg) ? arg : arguments);
				}
			}
		},

		insertChildren: function insertChildren(index, items) {
			var list = items,
			    first = list[0];
			if (first && typeof first[0] === 'number') list = [list];
			for (var i = items.length - 1; i >= 0; i--) {
				var item = list[i];
				if (list === items && !(item instanceof Path)) list = Base.slice(list);
				if (Array.isArray(item)) {
					list[i] = new Path({ segments: item, insert: false });
				} else if (item instanceof CompoundPath) {
					list.splice.apply(list, [i, 1].concat(item.removeChildren()));
					item.remove();
				}
			}
			return insertChildren.base.call(this, index, list);
		},

		reduce: function reduce(options) {
			var children = this._children;
			for (var i = children.length - 1; i >= 0; i--) {
				var path = children[i].reduce(options);
				if (path.isEmpty()) path.remove();
			}
			if (!children.length) {
				var path = new Path(Item.NO_INSERT);
				path.copyAttributes(this);
				path.insertAbove(this);
				this.remove();
				return path;
			}
			return reduce.base.call(this);
		},

		isClosed: function () {
			var children = this._children;
			for (var i = 0, l = children.length; i < l; i++) {
				if (!children[i]._closed) return false;
			}
			return true;
		},

		setClosed: function (closed) {
			var children = this._children;
			for (var i = 0, l = children.length; i < l; i++) {
				children[i].setClosed(closed);
			}
		},

		getFirstSegment: function () {
			var first = this.getFirstChild();
			return first && first.getFirstSegment();
		},

		getLastSegment: function () {
			var last = this.getLastChild();
			return last && last.getLastSegment();
		},

		getCurves: function () {
			var children = this._children,
			    curves = [];
			for (var i = 0, l = children.length; i < l; i++) curves.push.apply(curves, children[i].getCurves());
			return curves;
		},

		getFirstCurve: function () {
			var first = this.getFirstChild();
			return first && first.getFirstCurve();
		},

		getLastCurve: function () {
			var last = this.getLastChild();
			return last && last.getLastCurve();
		},

		getArea: function () {
			var children = this._children,
			    area = 0;
			for (var i = 0, l = children.length; i < l; i++) area += children[i].getArea();
			return area;
		},

		getLength: function () {
			var children = this._children,
			    length = 0;
			for (var i = 0, l = children.length; i < l; i++) length += children[i].getLength();
			return length;
		},

		getPathData: function (_matrix, _precision) {
			var children = this._children,
			    paths = [];
			for (var i = 0, l = children.length; i < l; i++) {
				var child = children[i],
				    mx = child._matrix;
				paths.push(child.getPathData(_matrix && !mx.isIdentity() ? _matrix.appended(mx) : _matrix, _precision));
			}
			return paths.join('');
		},

		_hitTestChildren: function _hitTestChildren(point, options, viewMatrix) {
			return _hitTestChildren.base.call(this, point, options.class === Path || options.type === 'path' ? options : Base.set({}, options, { fill: false }), viewMatrix);
		},

		_draw: function (ctx, param, viewMatrix, strokeMatrix) {
			var children = this._children;
			if (!children.length) return;

			param = param.extend({ dontStart: true, dontFinish: true });
			ctx.beginPath();
			for (var i = 0, l = children.length; i < l; i++) children[i].draw(ctx, param, strokeMatrix);

			if (!param.clip) {
				this._setStyles(ctx, param, viewMatrix);
				var style = this._style;
				if (style.hasFill()) {
					ctx.fill(style.getFillRule());
					ctx.shadowColor = 'rgba(0,0,0,0)';
				}
				if (style.hasStroke()) ctx.stroke();
			}
		},

		_drawSelected: function (ctx, matrix, selectionItems) {
			var children = this._children;
			for (var i = 0, l = children.length; i < l; i++) {
				var child = children[i],
				    mx = child._matrix;
				if (!selectionItems[child._id]) {
					child._drawSelected(ctx, mx.isIdentity() ? matrix : matrix.appended(mx));
				}
			}
		}
	}, new function () {
		function getCurrentPath(that, check) {
			var children = that._children;
			if (check && !children.length) throw new Error('Use a moveTo() command first');
			return children[children.length - 1];
		}

		return Base.each(['lineTo', 'cubicCurveTo', 'quadraticCurveTo', 'curveTo', 'arcTo', 'lineBy', 'cubicCurveBy', 'quadraticCurveBy', 'curveBy', 'arcBy'], function (key) {
			this[key] = function () {
				var path = getCurrentPath(this, true);
				path[key].apply(path, arguments);
			};
		}, {
			moveTo: function () {
				var current = getCurrentPath(this),
				    path = current && current.isEmpty() ? current : new Path(Item.NO_INSERT);
				if (path !== current) this.addChild(path);
				path.moveTo.apply(path, arguments);
			},

			moveBy: function () {
				var current = getCurrentPath(this, true),
				    last = current && current.getLastSegment(),
				    point = Point.read(arguments);
				this.moveTo(last ? point.add(last._point) : point);
			},

			closePath: function (tolerance) {
				getCurrentPath(this, true).closePath(tolerance);
			}
		});
	}(), Base.each(['reverse', 'flatten', 'simplify', 'smooth'], function (key) {
		this[key] = function (param) {
			var children = this._children,
			    res;
			for (var i = 0, l = children.length; i < l; i++) {
				res = children[i][key](param) || res;
			}
			return res;
		};
	}, {}));

	PathItem.inject(new function () {
		var min = Math.min,
		    max = Math.max,
		    abs = Math.abs,
		    operators = {
			unite: { '1': true, '2': true },
			intersect: { '2': true },
			subtract: { '1': true },
			exclude: { '1': true, '-1': true }
		};

		function preparePath(path, resolve) {
			var res = path.clone(false).reduce({ simplify: true }).transform(null, true, true);
			return resolve ? res.resolveCrossings().reorient(res.getFillRule() === 'nonzero', true) : res;
		}

		function createResult(ctor, paths, reduce, path1, path2, options) {
			var result = new ctor(Item.NO_INSERT);
			result.addChildren(paths, true);
			if (reduce) result = result.reduce({ simplify: true });
			if (!(options && options.insert === false)) {
				result.insertAbove(path2 && path1.isSibling(path2) && path1.getIndex() < path2.getIndex() ? path2 : path1);
			}
			result.copyAttributes(path1, true);
			return result;
		}

		function computeBoolean(path1, path2, operation, options) {
			if (options && options.stroke && /^(subtract|intersect)$/.test(operation)) return computeStrokeBoolean(path1, path2, operation === 'subtract');
			var _path1 = preparePath(path1, true),
			    _path2 = path2 && path1 !== path2 && preparePath(path2, true),
			    operator = operators[operation];
			operator[operation] = true;
			if (_path2 && (operator.subtract || operator.exclude) ^ (_path2.isClockwise() ^ _path1.isClockwise())) _path2.reverse();
			var crossings = divideLocations(CurveLocation.expand(_path1.getCrossings(_path2))),
			    paths1 = _path1._children || [_path1],
			    paths2 = _path2 && (_path2._children || [_path2]),
			    segments = [],
			    curves = [],
			    paths;

			function collect(paths) {
				for (var i = 0, l = paths.length; i < l; i++) {
					var path = paths[i];
					segments.push.apply(segments, path._segments);
					curves.push.apply(curves, path.getCurves());
					path._overlapsOnly = true;
				}
			}

			if (crossings.length) {
				collect(paths1);
				if (paths2) collect(paths2);
				for (var i = 0, l = crossings.length; i < l; i++) {
					propagateWinding(crossings[i]._segment, _path1, _path2, curves, operator);
				}
				for (var i = 0, l = segments.length; i < l; i++) {
					var segment = segments[i],
					    inter = segment._intersection;
					if (!segment._winding) {
						propagateWinding(segment, _path1, _path2, curves, operator);
					}
					if (!(inter && inter._overlap)) segment._path._overlapsOnly = false;
				}
				paths = tracePaths(segments, operator);
			} else {
				paths = reorientPaths(paths2 ? paths1.concat(paths2) : paths1.slice(), function (w) {
					return !!operator[w];
				});
			}

			return createResult(CompoundPath, paths, true, path1, path2, options);
		}

		function computeStrokeBoolean(path1, path2, subtract) {
			var _path1 = preparePath(path1),
			    _path2 = preparePath(path2),
			    crossings = _path1.getCrossings(_path2),
			    paths = [];

			function addPath(path) {
				if (_path2.contains(path.getPointAt(path.getLength() / 2)) ^ subtract) {
					paths.unshift(path);
					return true;
				}
			}

			for (var i = crossings.length - 1; i >= 0; i--) {
				var path = crossings[i].split();
				if (path) {
					if (addPath(path)) path.getFirstSegment().setHandleIn(0, 0);
					_path1.getLastSegment().setHandleOut(0, 0);
				}
			}
			addPath(_path1);
			return createResult(Group, paths, false, path1, path2);
		}

		function linkIntersections(from, to) {
			var prev = from;
			while (prev) {
				if (prev === to) return;
				prev = prev._previous;
			}
			while (from._next && from._next !== to) from = from._next;
			if (!from._next) {
				while (to._previous) to = to._previous;
				from._next = to;
				to._previous = from;
			}
		}

		function clearCurveHandles(curves) {
			for (var i = curves.length - 1; i >= 0; i--) curves[i].clearHandles();
		}

		function reorientPaths(paths, isInside, clockwise) {
			var length = paths && paths.length;
			if (length) {
				var lookup = Base.each(paths, function (path, i) {
					this[path._id] = {
						container: null,
						winding: path.isClockwise() ? 1 : -1,
						index: i
					};
				}, {}),
				    sorted = paths.slice().sort(function (a, b) {
					return abs(b.getArea()) - abs(a.getArea());
				}),
				    first = sorted[0];
				if (clockwise == null) clockwise = first.isClockwise();
				for (var i = 0; i < length; i++) {
					var path1 = sorted[i],
					    entry1 = lookup[path1._id],
					    point = path1.getInteriorPoint(),
					    containerWinding = 0;
					for (var j = i - 1; j >= 0; j--) {
						var path2 = sorted[j];
						if (path2.contains(point)) {
							var entry2 = lookup[path2._id];
							containerWinding = entry2.winding;
							entry1.winding += containerWinding;
							entry1.container = entry2.exclude ? entry2.container : path2;
							break;
						}
					}
					if (isInside(entry1.winding) === isInside(containerWinding)) {
						entry1.exclude = true;
						paths[entry1.index] = null;
					} else {
						var container = entry1.container;
						path1.setClockwise(container ? !container.isClockwise() : clockwise);
					}
				}
			}
			return paths;
		}

		function divideLocations(locations, include, clearLater) {
			var results = include && [],
			    tMin = 1e-8,
			    tMax = 1 - tMin,
			    clearHandles = false,
			    clearCurves = clearLater || [],
			    clearLookup = clearLater && {},
			    renormalizeLocs,
			    prevCurve,
			    prevTime;

			function getId(curve) {
				return curve._path._id + '.' + curve._segment1._index;
			}

			for (var i = (clearLater && clearLater.length) - 1; i >= 0; i--) {
				var curve = clearLater[i];
				if (curve._path) clearLookup[getId(curve)] = true;
			}

			for (var i = locations.length - 1; i >= 0; i--) {
				var loc = locations[i],
				    time = loc._time,
				    origTime = time,
				    exclude = include && !include(loc),
				    curve = loc._curve,
				    segment;
				if (curve) {
					if (curve !== prevCurve) {
						clearHandles = !curve.hasHandles() || clearLookup && clearLookup[getId(curve)];
						renormalizeLocs = [];
						prevTime = null;
						prevCurve = curve;
					} else if (prevTime >= tMin) {
						time /= prevTime;
					}
				}
				if (exclude) {
					if (renormalizeLocs) renormalizeLocs.push(loc);
					continue;
				} else if (include) {
					results.unshift(loc);
				}
				prevTime = origTime;
				if (time < tMin) {
					segment = curve._segment1;
				} else if (time > tMax) {
					segment = curve._segment2;
				} else {
					var newCurve = curve.divideAtTime(time, true);
					if (clearHandles) clearCurves.push(curve, newCurve);
					segment = newCurve._segment1;
					for (var j = renormalizeLocs.length - 1; j >= 0; j--) {
						var l = renormalizeLocs[j];
						l._time = (l._time - time) / (1 - time);
					}
				}
				loc._setSegment(segment);
				var inter = segment._intersection,
				    dest = loc._intersection;
				if (inter) {
					linkIntersections(inter, dest);
					var other = inter;
					while (other) {
						linkIntersections(other._intersection, inter);
						other = other._next;
					}
				} else {
					segment._intersection = dest;
				}
			}
			if (!clearLater) clearCurveHandles(clearCurves);
			return results || locations;
		}

		function getWinding(point, curves, dir, closed, dontFlip) {
			var ia = dir ? 1 : 0,
			    io = ia ^ 1,
			    pv = [point.x, point.y],
			    pa = pv[ia],
			    po = pv[io],
			    windingEpsilon = 1e-9,
			    qualityEpsilon = 1e-6,
			    paL = pa - windingEpsilon,
			    paR = pa + windingEpsilon,
			    windingL = 0,
			    windingR = 0,
			    onPath = false,
			    quality = 1,
			    roots = [],
			    vPrev,
			    vClose;

			function addWinding(v) {
				var o0 = v[io + 0],
				    o3 = v[io + 6];
				if (po < min(o0, o3) || po > max(o0, o3)) {
					return;
				}
				var a0 = v[ia + 0],
				    a1 = v[ia + 2],
				    a2 = v[ia + 4],
				    a3 = v[ia + 6];
				if (o0 === o3) {
					if (a0 < paR && a3 > paL || a3 < paR && a0 > paL) {
						onPath = true;
					}
					return;
				}
				var t = po === o0 ? 0 : po === o3 ? 1 : paL > max(a0, a1, a2, a3) || paR < min(a0, a1, a2, a3) ? 1 : Curve.solveCubic(v, io, po, roots, 0, 1) === 1 ? roots[0] : 0.5,
				    a = t === 0 ? a0 : t === 1 ? a3 : Curve.getPoint(v, t)[dir ? 'y' : 'x'],
				    winding = o0 > o3 ? 1 : -1,
				    windingPrev = vPrev[io] > vPrev[io + 6] ? 1 : -1,
				    a3Prev = vPrev[ia + 6];
				if (po !== o0) {
					if (a < paL) {
						windingL += winding;
					} else if (a > paR) {
						windingR += winding;
					} else {
						onPath = true;
					}
					if (a > pa - qualityEpsilon && a < pa + qualityEpsilon) quality /= 2;
				} else {
					if (winding !== windingPrev) {
						if (a0 < paL) {
							windingL += winding;
						} else if (a0 > paR) {
							windingR += winding;
						}
					} else if (a0 != a3Prev) {
						if (a3Prev < paR && a > paR) {
							windingR += winding;
							onPath = true;
						} else if (a3Prev > paL && a < paL) {
							windingL += winding;
							onPath = true;
						}
					}
					quality = 0;
				}
				vPrev = v;
				return !dontFlip && a > paL && a < paR && Curve.getTangent(v, t)[dir ? 'x' : 'y'] === 0 && getWinding(point, curves, dir ? 0 : 1, closed, true);
			}

			function handleCurve(v) {
				var o0 = v[io + 0],
				    o1 = v[io + 2],
				    o2 = v[io + 4],
				    o3 = v[io + 6];
				if (po <= max(o0, o1, o2, o3) && po >= min(o0, o1, o2, o3)) {
					var a0 = v[ia + 0],
					    a1 = v[ia + 2],
					    a2 = v[ia + 4],
					    a3 = v[ia + 6],
					    monoCurves = paL > max(a0, a1, a2, a3) || paR < min(a0, a1, a2, a3) ? [v] : Curve.getMonoCurves(v, dir),
					    res;
					for (var i = 0, l = monoCurves.length; i < l; i++) {
						if (res = addWinding(monoCurves[i])) return res;
					}
				}
			}

			for (var i = 0, l = curves.length; i < l; i++) {
				var curve = curves[i],
				    path = curve._path,
				    v = curve.getValues(),
				    res;
				if (!i || curves[i - 1]._path !== path) {
					vPrev = null;
					if (!path._closed) {
						vClose = Curve.getValues(path.getLastCurve().getSegment2(), curve.getSegment1(), null, !closed);
						if (vClose[io] !== vClose[io + 6]) {
							vPrev = vClose;
						}
					}

					if (!vPrev) {
						vPrev = v;
						var prev = path.getLastCurve();
						while (prev && prev !== curve) {
							var v2 = prev.getValues();
							if (v2[io] !== v2[io + 6]) {
								vPrev = v2;
								break;
							}
							prev = prev.getPrevious();
						}
					}
				}

				if (res = handleCurve(v)) return res;

				if (i + 1 === l || curves[i + 1]._path !== path) {
					if (vClose && (res = handleCurve(vClose))) return res;
					vClose = null;
				}
			}
			windingL = abs(windingL);
			windingR = abs(windingR);
			return {
				winding: max(windingL, windingR),
				windingL: windingL,
				windingR: windingR,
				quality: quality,
				onPath: onPath
			};
		}

		function propagateWinding(segment, path1, path2, curves, operator) {
			var chain = [],
			    start = segment,
			    totalLength = 0,
			    winding;
			do {
				var curve = segment.getCurve(),
				    length = curve.getLength();
				chain.push({ segment: segment, curve: curve, length: length });
				totalLength += length;
				segment = segment.getNext();
			} while (segment && !segment._intersection && segment !== start);
			var offsets = [0.5, 0.25, 0.75],
			    windingZero = { winding: 0, quality: 0 },
			    winding = windingZero,
			    tMin = 1e-8,
			    tMax = 1 - tMin;
			for (var i = 0; i < offsets.length && winding.quality < 0.5; i++) {
				var length = totalLength * offsets[i];
				for (var j = 0, l = chain.length; j < l; j++) {
					var entry = chain[j],
					    curveLength = entry.length;
					if (length <= curveLength) {
						var curve = entry.curve,
						    path = curve._path,
						    parent = path._parent,
						    t = Numerical.clamp(curve.getTimeAt(length), tMin, tMax),
						    pt = curve.getPointAtTime(t),
						    dir = abs(curve.getTangentAtTime(t).normalize().y) < Math.SQRT1_2 ? 1 : 0;
						if (parent instanceof CompoundPath) path = parent;
						var wind = !(operator.subtract && path2 && (path === path1 && path2._getWinding(pt, dir, true).winding || path === path2 && !path1._getWinding(pt, dir, true).winding)) ? getWinding(pt, curves, dir, true) : windingZero;
						if (wind.quality > winding.quality) winding = wind;
						break;
					}
					length -= curveLength;
				}
			}
			for (var j = chain.length - 1; j >= 0; j--) {
				chain[j].segment._winding = winding;
			}
		}

		function tracePaths(segments, operator) {
			var paths = [],
			    starts;

			function isValid(seg) {
				var winding;
				return !!(seg && !seg._visited && (!operator || operator[(winding = seg._winding || {}).winding] && !(operator.unite && winding.winding === 2 && winding.windingL && winding.windingR)));
			}

			function isStart(seg) {
				if (seg) {
					for (var i = 0, l = starts.length; i < l; i++) {
						if (seg === starts[i]) return true;
					}
				}
				return false;
			}

			function visitPath(path) {
				var segments = path._segments;
				for (var i = 0, l = segments.length; i < l; i++) {
					segments[i]._visited = true;
				}
			}

			function getCrossingSegments(segment, collectStarts) {
				var inter = segment._intersection,
				    start = inter,
				    crossings = [];
				if (collectStarts) starts = [segment];

				function collect(inter, end) {
					while (inter && inter !== end) {
						var other = inter._segment,
						    path = other._path,
						    next = other.getNext() || path && path.getFirstSegment(),
						    nextInter = next && next._intersection;
						if (other !== segment && (isStart(other) || isStart(next) || next && isValid(other) && (isValid(next) || nextInter && isValid(nextInter._segment)))) {
							crossings.push(other);
						}
						if (collectStarts) starts.push(other);
						inter = inter._next;
					}
				}

				if (inter) {
					collect(inter);
					while (inter && inter._prev) inter = inter._prev;
					collect(inter, start);
				}
				return crossings;
			}

			segments.sort(function (seg1, seg2) {
				var inter1 = seg1._intersection,
				    inter2 = seg2._intersection,
				    over1 = !!(inter1 && inter1._overlap),
				    over2 = !!(inter2 && inter2._overlap),
				    path1 = seg1._path,
				    path2 = seg2._path;
				return over1 ^ over2 ? over1 ? 1 : -1 : !inter1 ^ !inter2 ? inter1 ? 1 : -1 : path1 !== path2 ? path1._id - path2._id : seg1._index - seg2._index;
			});

			for (var i = 0, l = segments.length; i < l; i++) {
				var seg = segments[i],
				    valid = isValid(seg),
				    path = null,
				    finished = false,
				    closed = true,
				    branches = [],
				    branch,
				    visited,
				    handleIn;
				if (valid && seg._path._overlapsOnly) {
					var path1 = seg._path,
					    path2 = seg._intersection._segment._path;
					if (path1.compare(path2)) {
						if (path1.getArea()) paths.push(path1.clone(false));
						visitPath(path1);
						visitPath(path2);
						valid = false;
					}
				}
				while (valid) {
					var first = !path,
					    crossings = getCrossingSegments(seg, first),
					    other = crossings.shift(),
					    finished = !first && (isStart(seg) || isStart(other)),
					    cross = !finished && other;
					if (first) {
						path = new Path(Item.NO_INSERT);
						branch = null;
					}
					if (finished) {
						if (seg.isFirst() || seg.isLast()) closed = seg._path._closed;
						seg._visited = true;
						break;
					}
					if (cross && branch) {
						branches.push(branch);
						branch = null;
					}
					if (!branch) {
						if (cross) crossings.push(seg);
						branch = {
							start: path._segments.length,
							crossings: crossings,
							visited: visited = [],
							handleIn: handleIn
						};
					}
					if (cross) seg = other;
					if (!isValid(seg)) {
						path.removeSegments(branch.start);
						for (var j = 0, k = visited.length; j < k; j++) {
							visited[j]._visited = false;
						}
						visited.length = 0;
						do {
							seg = branch && branch.crossings.shift();
							if (!seg) {
								branch = branches.pop();
								if (branch) {
									visited = branch.visited;
									handleIn = branch.handleIn;
								}
							}
						} while (branch && !isValid(seg));
						if (!seg) break;
					}
					var next = seg.getNext();
					path.add(new Segment(seg._point, handleIn, next && seg._handleOut));
					seg._visited = true;
					visited.push(seg);
					seg = next || seg._path.getFirstSegment();
					handleIn = next && next._handleIn;
				}
				if (finished) {
					if (closed) {
						path.firstSegment.setHandleIn(handleIn);
						path.setClosed(closed);
					}
					if (path.getArea() !== 0) {
						paths.push(path);
					}
				}
			}
			return paths;
		}

		return {
			_getWinding: function (point, dir, closed) {
				return getWinding(point, this.getCurves(), dir, closed);
			},

			unite: function (path, options) {
				return computeBoolean(this, path, 'unite', options);
			},

			intersect: function (path, options) {
				return computeBoolean(this, path, 'intersect', options);
			},

			subtract: function (path) {
				return computeBoolean(this, path, 'subtract');
			},

			exclude: function (path, options) {
				return computeBoolean(this, path, 'exclude', options);
			},

			divide: function (path, options) {
				return createResult(Group, [this.subtract(path, options), this.intersect(path, options)], true, this, path, options);
			},

			resolveCrossings: function () {
				var children = this._children,
				    paths = children || [this];

				function hasOverlap(seg) {
					var inter = seg && seg._intersection;
					return inter && inter._overlap;
				}

				var hasOverlaps = false,
				    hasCrossings = false,
				    intersections = this.getIntersections(null, function (inter) {
					return inter.hasOverlap() && (hasOverlaps = true) || inter.isCrossing() && (hasCrossings = true);
				}),
				    clearCurves = hasOverlaps && hasCrossings && [];
				intersections = CurveLocation.expand(intersections);
				if (hasOverlaps) {
					var overlaps = divideLocations(intersections, function (inter) {
						return inter.hasOverlap();
					}, clearCurves);
					for (var i = overlaps.length - 1; i >= 0; i--) {
						var seg = overlaps[i]._segment,
						    prev = seg.getPrevious(),
						    next = seg.getNext();
						if (hasOverlap(prev) && hasOverlap(next)) {
							seg.remove();
							prev._handleOut._set(0, 0);
							next._handleIn._set(0, 0);
							if (prev !== seg && !prev.getCurve().hasLength()) {
								next._handleIn.set(prev._handleIn);
								prev.remove();
							}
						}
					}
				}
				if (hasCrossings) {
					divideLocations(intersections, hasOverlaps && function (inter) {
						var curve1 = inter.getCurve(),
						    seg1 = inter.getSegment(),
						    other = inter._intersection,
						    curve2 = other._curve,
						    seg2 = other._segment;
						if (curve1 && curve2 && curve1._path && curve2._path) return true;
						if (seg1) seg1._intersection = null;
						if (seg2) seg2._intersection = null;
					}, clearCurves);
					if (clearCurves) clearCurveHandles(clearCurves);
					paths = tracePaths(Base.each(paths, function (path) {
						this.push.apply(this, path._segments);
					}, []));
				}
				var length = paths.length,
				    item;
				if (length > 1 && children) {
					if (paths !== children) this.setChildren(paths);
					item = this;
				} else if (length === 1 && !children) {
					if (paths[0] !== this) this.setSegments(paths[0].removeSegments());
					item = this;
				}
				if (!item) {
					item = new CompoundPath(Item.NO_INSERT);
					item.addChildren(paths);
					item = item.reduce();
					item.copyAttributes(this);
					this.replaceWith(item);
				}
				return item;
			},

			reorient: function (nonZero, clockwise) {
				var children = this._children;
				if (children && children.length) {
					this.setChildren(reorientPaths(this.removeChildren(), function (w) {
						return !!(nonZero ? w : w & 1);
					}, clockwise));
				} else if (clockwise !== undefined) {
					this.setClockwise(clockwise);
				}
				return this;
			},

			getInteriorPoint: function () {
				var bounds = this.getBounds(),
				    point = bounds.getCenter(true);
				if (!this.contains(point)) {
					var curves = this.getCurves(),
					    y = point.y,
					    intercepts = [],
					    roots = [];
					for (var i = 0, l = curves.length; i < l; i++) {
						var v = curves[i].getValues(),
						    o0 = v[1],
						    o1 = v[3],
						    o2 = v[5],
						    o3 = v[7];
						if (y >= min(o0, o1, o2, o3) && y <= max(o0, o1, o2, o3)) {
							var monoCurves = Curve.getMonoCurves(v);
							for (var j = 0, m = monoCurves.length; j < m; j++) {
								var mv = monoCurves[j],
								    mo0 = mv[1],
								    mo3 = mv[7];
								if (mo0 !== mo3 && (y >= mo0 && y <= mo3 || y >= mo3 && y <= mo0)) {
									var x = y === mo0 ? mv[0] : y === mo3 ? mv[6] : Curve.solveCubic(mv, 1, y, roots, 0, 1) === 1 ? Curve.getPoint(mv, roots[0]).x : (mv[0] + mv[6]) / 2;
									intercepts.push(x);
								}
							}
						}
					}
					if (intercepts.length > 1) {
						intercepts.sort(function (a, b) {
							return a - b;
						});
						point.x = (intercepts[0] + intercepts[1]) / 2;
					}
				}
				return point;
			}
		};
	}());

	var PathFlattener = Base.extend({
		_class: 'PathFlattener',

		initialize: function (path, flatness, maxRecursion, ignoreStraight, matrix) {
			var curves = [],
			    parts = [],
			    length = 0,
			    minSpan = 1 / (maxRecursion || 32),
			    segments = path._segments,
			    segment1 = segments[0],
			    segment2;

			function addCurve(segment1, segment2) {
				var curve = Curve.getValues(segment1, segment2, matrix);
				curves.push(curve);
				computeParts(curve, segment1._index, 0, 1);
			}

			function computeParts(curve, index, t1, t2) {
				if (t2 - t1 > minSpan && !(ignoreStraight && Curve.isStraight(curve)) && !Curve.isFlatEnough(curve, flatness || 0.25)) {
					var halves = Curve.subdivide(curve, 0.5),
					    tMid = (t1 + t2) / 2;
					computeParts(halves[0], index, t1, tMid);
					computeParts(halves[1], index, tMid, t2);
				} else {
					var dx = curve[6] - curve[0],
					    dy = curve[7] - curve[1],
					    dist = Math.sqrt(dx * dx + dy * dy);
					if (dist > 0) {
						length += dist;
						parts.push({
							offset: length,
							curve: curve,
							index: index,
							time: t2
						});
					}
				}
			}

			for (var i = 1, l = segments.length; i < l; i++) {
				segment2 = segments[i];
				addCurve(segment1, segment2);
				segment1 = segment2;
			}
			if (path._closed) addCurve(segment2, segments[0]);
			this.curves = curves;
			this.parts = parts;
			this.length = length;
			this.index = 0;
		},

		_get: function (offset) {
			var parts = this.parts,
			    length = parts.length,
			    start,
			    i,
			    j = this.index;
			for (;;) {
				i = j;
				if (!j || parts[--j].offset < offset) break;
			}
			for (; i < length; i++) {
				var part = parts[i];
				if (part.offset >= offset) {
					this.index = i;
					var prev = parts[i - 1],
					    prevTime = prev && prev.index === part.index ? prev.time : 0,
					    prevOffset = prev ? prev.offset : 0;
					return {
						index: part.index,
						time: prevTime + (part.time - prevTime) * (offset - prevOffset) / (part.offset - prevOffset)
					};
				}
			}
			return {
				index: parts[length - 1].index,
				time: 1
			};
		},

		drawPart: function (ctx, from, to) {
			var start = this._get(from),
			    end = this._get(to);
			for (var i = start.index, l = end.index; i <= l; i++) {
				var curve = Curve.getPart(this.curves[i], i === start.index ? start.time : 0, i === end.index ? end.time : 1);
				if (i === start.index) ctx.moveTo(curve[0], curve[1]);
				ctx.bezierCurveTo.apply(ctx, curve.slice(2));
			}
		}
	}, Base.each(Curve._evaluateMethods, function (name) {
		this[name + 'At'] = function (offset) {
			var param = this._get(offset);
			return Curve[name](this.curves[param.index], param.time);
		};
	}, {}));

	var PathFitter = Base.extend({
		initialize: function (path) {
			var points = this.points = [],
			    segments = path._segments,
			    closed = path._closed;
			for (var i = 0, prev, l = segments.length; i < l; i++) {
				var point = segments[i].point;
				if (!prev || !prev.equals(point)) {
					points.push(prev = point.clone());
				}
			}
			if (closed) {
				points.unshift(points[points.length - 1]);
				points.push(points[1]);
			}
			this.closed = closed;
		},

		fit: function (error) {
			var points = this.points,
			    length = points.length,
			    segments = null;
			if (length > 0) {
				segments = [new Segment(points[0])];
				if (length > 1) {
					this.fitCubic(segments, error, 0, length - 1, points[1].subtract(points[0]), points[length - 2].subtract(points[length - 1]));
					if (this.closed) {
						segments.shift();
						segments.pop();
					}
				}
			}
			return segments;
		},

		fitCubic: function (segments, error, first, last, tan1, tan2) {
			var points = this.points;
			if (last - first === 1) {
				var pt1 = points[first],
				    pt2 = points[last],
				    dist = pt1.getDistance(pt2) / 3;
				this.addCurve(segments, [pt1, pt1.add(tan1.normalize(dist)), pt2.add(tan2.normalize(dist)), pt2]);
				return;
			}
			var uPrime = this.chordLengthParameterize(first, last),
			    maxError = Math.max(error, error * error),
			    split,
			    parametersInOrder = true;
			for (var i = 0; i <= 4; i++) {
				var curve = this.generateBezier(first, last, uPrime, tan1, tan2);
				var max = this.findMaxError(first, last, curve, uPrime);
				if (max.error < error && parametersInOrder) {
					this.addCurve(segments, curve);
					return;
				}
				split = max.index;
				if (max.error >= maxError) break;
				parametersInOrder = this.reparameterize(first, last, uPrime, curve);
				maxError = max.error;
			}
			var tanCenter = points[split - 1].subtract(points[split + 1]);
			this.fitCubic(segments, error, first, split, tan1, tanCenter);
			this.fitCubic(segments, error, split, last, tanCenter.negate(), tan2);
		},

		addCurve: function (segments, curve) {
			var prev = segments[segments.length - 1];
			prev.setHandleOut(curve[1].subtract(curve[0]));
			segments.push(new Segment(curve[3], curve[2].subtract(curve[3])));
		},

		generateBezier: function (first, last, uPrime, tan1, tan2) {
			var epsilon = 1e-12,
			    abs = Math.abs,
			    points = this.points,
			    pt1 = points[first],
			    pt2 = points[last],
			    C = [[0, 0], [0, 0]],
			    X = [0, 0];

			for (var i = 0, l = last - first + 1; i < l; i++) {
				var u = uPrime[i],
				    t = 1 - u,
				    b = 3 * u * t,
				    b0 = t * t * t,
				    b1 = b * t,
				    b2 = b * u,
				    b3 = u * u * u,
				    a1 = tan1.normalize(b1),
				    a2 = tan2.normalize(b2),
				    tmp = points[first + i].subtract(pt1.multiply(b0 + b1)).subtract(pt2.multiply(b2 + b3));
				C[0][0] += a1.dot(a1);
				C[0][1] += a1.dot(a2);
				C[1][0] = C[0][1];
				C[1][1] += a2.dot(a2);
				X[0] += a1.dot(tmp);
				X[1] += a2.dot(tmp);
			}

			var detC0C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1],
			    alpha1,
			    alpha2;
			if (abs(detC0C1) > epsilon) {
				var detC0X = C[0][0] * X[1] - C[1][0] * X[0],
				    detXC1 = X[0] * C[1][1] - X[1] * C[0][1];
				alpha1 = detXC1 / detC0C1;
				alpha2 = detC0X / detC0C1;
			} else {
				var c0 = C[0][0] + C[0][1],
				    c1 = C[1][0] + C[1][1];
				alpha1 = alpha2 = abs(c0) > epsilon ? X[0] / c0 : abs(c1) > epsilon ? X[1] / c1 : 0;
			}

			var segLength = pt2.getDistance(pt1),
			    eps = epsilon * segLength,
			    handle1,
			    handle2;
			if (alpha1 < eps || alpha2 < eps) {
				alpha1 = alpha2 = segLength / 3;
			} else {
				var line = pt2.subtract(pt1);
				handle1 = tan1.normalize(alpha1);
				handle2 = tan2.normalize(alpha2);
				if (handle1.dot(line) - handle2.dot(line) > segLength * segLength) {
					alpha1 = alpha2 = segLength / 3;
					handle1 = handle2 = null;
				}
			}

			return [pt1, pt1.add(handle1 || tan1.normalize(alpha1)), pt2.add(handle2 || tan2.normalize(alpha2)), pt2];
		},

		reparameterize: function (first, last, u, curve) {
			for (var i = first; i <= last; i++) {
				u[i - first] = this.findRoot(curve, this.points[i], u[i - first]);
			}
			for (var i = 1, l = u.length; i < l; i++) {
				if (u[i] <= u[i - 1]) return false;
			}
			return true;
		},

		findRoot: function (curve, point, u) {
			var curve1 = [],
			    curve2 = [];
			for (var i = 0; i <= 2; i++) {
				curve1[i] = curve[i + 1].subtract(curve[i]).multiply(3);
			}
			for (var i = 0; i <= 1; i++) {
				curve2[i] = curve1[i + 1].subtract(curve1[i]).multiply(2);
			}
			var pt = this.evaluate(3, curve, u),
			    pt1 = this.evaluate(2, curve1, u),
			    pt2 = this.evaluate(1, curve2, u),
			    diff = pt.subtract(point),
			    df = pt1.dot(pt1) + diff.dot(pt2);
			return Numerical.isZero(df) ? u : u - diff.dot(pt1) / df;
		},

		evaluate: function (degree, curve, t) {
			var tmp = curve.slice();
			for (var i = 1; i <= degree; i++) {
				for (var j = 0; j <= degree - i; j++) {
					tmp[j] = tmp[j].multiply(1 - t).add(tmp[j + 1].multiply(t));
				}
			}
			return tmp[0];
		},

		chordLengthParameterize: function (first, last) {
			var u = [0];
			for (var i = first + 1; i <= last; i++) {
				u[i - first] = u[i - first - 1] + this.points[i].getDistance(this.points[i - 1]);
			}
			for (var i = 1, m = last - first; i <= m; i++) {
				u[i] /= u[m];
			}
			return u;
		},

		findMaxError: function (first, last, curve, u) {
			var index = Math.floor((last - first + 1) / 2),
			    maxDist = 0;
			for (var i = first + 1; i < last; i++) {
				var P = this.evaluate(3, curve, u[i - first]);
				var v = P.subtract(this.points[i]);
				var dist = v.x * v.x + v.y * v.y;
				if (dist >= maxDist) {
					maxDist = dist;
					index = i;
				}
			}
			return {
				error: maxDist,
				index: index
			};
		}
	});

	var TextItem = Item.extend({
		_class: 'TextItem',
		_applyMatrix: false,
		_canApplyMatrix: false,
		_serializeFields: {
			content: null
		},
		_boundsOptions: { stroke: false, handle: false },

		initialize: function TextItem(arg) {
			this._content = '';
			this._lines = [];
			var hasProps = arg && Base.isPlainObject(arg) && arg.x === undefined && arg.y === undefined;
			this._initialize(hasProps && arg, !hasProps && Point.read(arguments));
		},

		_equals: function (item) {
			return this._content === item._content;
		},

		copyContent: function (source) {
			this.setContent(source._content);
		},

		getContent: function () {
			return this._content;
		},

		setContent: function (content) {
			this._content = '' + content;
			this._lines = this._content.split(/\r\n|\n|\r/mg);
			this._changed(265);
		},

		isEmpty: function () {
			return !this._content;
		},

		getCharacterStyle: '#getStyle',
		setCharacterStyle: '#setStyle',

		getParagraphStyle: '#getStyle',
		setParagraphStyle: '#setStyle'
	});

	var PointText = TextItem.extend({
		_class: 'PointText',

		initialize: function PointText() {
			TextItem.apply(this, arguments);
		},

		getPoint: function () {
			var point = this._matrix.getTranslation();
			return new LinkedPoint(point.x, point.y, this, 'setPoint');
		},

		setPoint: function () {
			var point = Point.read(arguments);
			this.translate(point.subtract(this._matrix.getTranslation()));
		},

		_draw: function (ctx, param, viewMatrix) {
			if (!this._content) return;
			this._setStyles(ctx, param, viewMatrix);
			var lines = this._lines,
			    style = this._style,
			    hasFill = style.hasFill(),
			    hasStroke = style.hasStroke(),
			    leading = style.getLeading(),
			    shadowColor = ctx.shadowColor;
			ctx.font = style.getFontStyle();
			ctx.textAlign = style.getJustification();
			for (var i = 0, l = lines.length; i < l; i++) {
				ctx.shadowColor = shadowColor;
				var line = lines[i];
				if (hasFill) {
					ctx.fillText(line, 0, 0);
					ctx.shadowColor = 'rgba(0,0,0,0)';
				}
				if (hasStroke) ctx.strokeText(line, 0, 0);
				ctx.translate(0, leading);
			}
		},

		_getBounds: function (matrix, options) {
			var style = this._style,
			    lines = this._lines,
			    numLines = lines.length,
			    justification = style.getJustification(),
			    leading = style.getLeading(),
			    width = this.getView().getTextWidth(style.getFontStyle(), lines),
			    x = 0;
			if (justification !== 'left') x -= width / (justification === 'center' ? 2 : 1);
			var bounds = new Rectangle(x, numLines ? -0.75 * leading : 0, width, numLines * leading);
			return matrix ? matrix._transformBounds(bounds, bounds) : bounds;
		}
	});

	var Color = Base.extend(new function () {
		var types = {
			gray: ['gray'],
			rgb: ['red', 'green', 'blue'],
			hsb: ['hue', 'saturation', 'brightness'],
			hsl: ['hue', 'saturation', 'lightness'],
			gradient: ['gradient', 'origin', 'destination', 'highlight']
		};

		var componentParsers = {},
		    colorCache = {},
		    colorCtx;

		function fromCSS(string) {
			var match = string.match(/^#(\w{1,2})(\w{1,2})(\w{1,2})$/),
			    components;
			if (match) {
				components = [0, 0, 0];
				for (var i = 0; i < 3; i++) {
					var value = match[i + 1];
					components[i] = parseInt(value.length == 1 ? value + value : value, 16) / 255;
				}
			} else if (match = string.match(/^rgba?\((.*)\)$/)) {
				components = match[1].split(',');
				for (var i = 0, l = components.length; i < l; i++) {
					var value = +components[i];
					components[i] = i < 3 ? value / 255 : value;
				}
			} else if (window) {
				var cached = colorCache[string];
				if (!cached) {
					if (!colorCtx) {
						colorCtx = CanvasProvider.getContext(1, 1);
						colorCtx.globalCompositeOperation = 'copy';
					}
					colorCtx.fillStyle = 'rgba(0,0,0,0)';
					colorCtx.fillStyle = string;
					colorCtx.fillRect(0, 0, 1, 1);
					var data = colorCtx.getImageData(0, 0, 1, 1).data;
					cached = colorCache[string] = [data[0] / 255, data[1] / 255, data[2] / 255];
				}
				components = cached.slice();
			} else {
				components = [0, 0, 0];
			}
			return components;
		}

		var hsbIndices = [[0, 3, 1], [2, 0, 1], [1, 0, 3], [1, 2, 0], [3, 1, 0], [0, 1, 2]];

		var converters = {
			'rgb-hsb': function (r, g, b) {
				var max = Math.max(r, g, b),
				    min = Math.min(r, g, b),
				    delta = max - min,
				    h = delta === 0 ? 0 : (max == r ? (g - b) / delta + (g < b ? 6 : 0) : max == g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60;
				return [h, max === 0 ? 0 : delta / max, max];
			},

			'hsb-rgb': function (h, s, b) {
				h = (h / 60 % 6 + 6) % 6;
				var i = Math.floor(h),
				    f = h - i,
				    i = hsbIndices[i],
				    v = [b, b * (1 - s), b * (1 - s * f), b * (1 - s * (1 - f))];
				return [v[i[0]], v[i[1]], v[i[2]]];
			},

			'rgb-hsl': function (r, g, b) {
				var max = Math.max(r, g, b),
				    min = Math.min(r, g, b),
				    delta = max - min,
				    achromatic = delta === 0,
				    h = achromatic ? 0 : (max == r ? (g - b) / delta + (g < b ? 6 : 0) : max == g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60,
				    l = (max + min) / 2,
				    s = achromatic ? 0 : l < 0.5 ? delta / (max + min) : delta / (2 - max - min);
				return [h, s, l];
			},

			'hsl-rgb': function (h, s, l) {
				h = (h / 360 % 1 + 1) % 1;
				if (s === 0) return [l, l, l];
				var t3s = [h + 1 / 3, h, h - 1 / 3],
				    t2 = l < 0.5 ? l * (1 + s) : l + s - l * s,
				    t1 = 2 * l - t2,
				    c = [];
				for (var i = 0; i < 3; i++) {
					var t3 = t3s[i];
					if (t3 < 0) t3 += 1;
					if (t3 > 1) t3 -= 1;
					c[i] = 6 * t3 < 1 ? t1 + (t2 - t1) * 6 * t3 : 2 * t3 < 1 ? t2 : 3 * t3 < 2 ? t1 + (t2 - t1) * (2 / 3 - t3) * 6 : t1;
				}
				return c;
			},

			'rgb-gray': function (r, g, b) {
				return [r * 0.2989 + g * 0.587 + b * 0.114];
			},

			'gray-rgb': function (g) {
				return [g, g, g];
			},

			'gray-hsb': function (g) {
				return [0, 0, g];
			},

			'gray-hsl': function (g) {
				return [0, 0, g];
			},

			'gradient-rgb': function () {
				return [];
			},

			'rgb-gradient': function () {
				return [];
			}

		};

		return Base.each(types, function (properties, type) {
			componentParsers[type] = [];
			Base.each(properties, function (name, index) {
				var part = Base.capitalize(name),
				    hasOverlap = /^(hue|saturation)$/.test(name),
				    parser = componentParsers[type][index] = name === 'gradient' ? function (value) {
					var current = this._components[0];
					value = Gradient.read(Array.isArray(value) ? value : arguments, 0, { readNull: true });
					if (current !== value) {
						if (current) current._removeOwner(this);
						if (value) value._addOwner(this);
					}
					return value;
				} : type === 'gradient' ? function () {
					return Point.read(arguments, 0, {
						readNull: name === 'highlight',
						clone: true
					});
				} : function (value) {
					return value == null || isNaN(value) ? 0 : value;
				};

				this['get' + part] = function () {
					return this._type === type || hasOverlap && /^hs[bl]$/.test(this._type) ? this._components[index] : this._convert(type)[index];
				};

				this['set' + part] = function (value) {
					if (this._type !== type && !(hasOverlap && /^hs[bl]$/.test(this._type))) {
						this._components = this._convert(type);
						this._properties = types[type];
						this._type = type;
					}
					this._components[index] = parser.call(this, value);
					this._changed();
				};
			}, this);
		}, {
			_class: 'Color',
			_readIndex: true,

			initialize: function Color(arg) {
				var args = arguments,
				    reading = this.__read,
				    read = 0,
				    type,
				    components,
				    alpha,
				    values;
				if (Array.isArray(arg)) {
					args = arg;
					arg = args[0];
				}
				var argType = arg != null && typeof arg;
				if (argType === 'string' && arg in types) {
					type = arg;
					arg = args[1];
					if (Array.isArray(arg)) {
						components = arg;
						alpha = args[2];
					} else {
						if (reading) read = 1;
						args = Base.slice(args, 1);
						argType = typeof arg;
					}
				}
				if (!components) {
					values = argType === 'number' ? args : argType === 'object' && arg.length != null ? arg : null;
					if (values) {
						if (!type) type = values.length >= 3 ? 'rgb' : 'gray';
						var length = types[type].length;
						alpha = values[length];
						if (reading) {
							read += values === arguments ? length + (alpha != null ? 1 : 0) : 1;
						}
						if (values.length > length) values = Base.slice(values, 0, length);
					} else if (argType === 'string') {
						type = 'rgb';
						components = fromCSS(arg);
						if (components.length === 4) {
							alpha = components[3];
							components.length--;
						}
					} else if (argType === 'object') {
						if (arg.constructor === Color) {
							type = arg._type;
							components = arg._components.slice();
							alpha = arg._alpha;
							if (type === 'gradient') {
								for (var i = 1, l = components.length; i < l; i++) {
									var point = components[i];
									if (point) components[i] = point.clone();
								}
							}
						} else if (arg.constructor === Gradient) {
							type = 'gradient';
							values = args;
						} else {
							type = 'hue' in arg ? 'lightness' in arg ? 'hsl' : 'hsb' : 'gradient' in arg || 'stops' in arg || 'radial' in arg ? 'gradient' : 'gray' in arg ? 'gray' : 'rgb';
							var properties = types[type],
							    parsers = componentParsers[type];
							this._components = components = [];
							for (var i = 0, l = properties.length; i < l; i++) {
								var value = arg[properties[i]];
								if (value == null && !i && type === 'gradient' && 'stops' in arg) {
									value = {
										stops: arg.stops,
										radial: arg.radial
									};
								}
								value = parsers[i].call(this, value);
								if (value != null) components[i] = value;
							}
							alpha = arg.alpha;
						}
					}
					if (reading && type) read = 1;
				}
				this._type = type || 'rgb';
				if (!components) {
					this._components = components = [];
					var parsers = componentParsers[this._type];
					for (var i = 0, l = parsers.length; i < l; i++) {
						var value = parsers[i].call(this, values && values[i]);
						if (value != null) components[i] = value;
					}
				}
				this._components = components;
				this._properties = types[this._type];
				this._alpha = alpha;
				if (reading) this.__read = read;
				return this;
			},

			set: '#initialize',

			_serialize: function (options, dictionary) {
				var components = this.getComponents();
				return Base.serialize(/^(gray|rgb)$/.test(this._type) ? components : [this._type].concat(components), options, true, dictionary);
			},

			_changed: function () {
				this._canvasStyle = null;
				if (this._owner) this._owner._changed(65);
			},

			_convert: function (type) {
				var converter;
				return this._type === type ? this._components.slice() : (converter = converters[this._type + '-' + type]) ? converter.apply(this, this._components) : converters['rgb-' + type].apply(this, converters[this._type + '-rgb'].apply(this, this._components));
			},

			convert: function (type) {
				return new Color(type, this._convert(type), this._alpha);
			},

			getType: function () {
				return this._type;
			},

			setType: function (type) {
				this._components = this._convert(type);
				this._properties = types[type];
				this._type = type;
			},

			getComponents: function () {
				var components = this._components.slice();
				if (this._alpha != null) components.push(this._alpha);
				return components;
			},

			getAlpha: function () {
				return this._alpha != null ? this._alpha : 1;
			},

			setAlpha: function (alpha) {
				this._alpha = alpha == null ? null : Math.min(Math.max(alpha, 0), 1);
				this._changed();
			},

			hasAlpha: function () {
				return this._alpha != null;
			},

			equals: function (color) {
				var col = Base.isPlainValue(color, true) ? Color.read(arguments) : color;
				return col === this || col && this._class === col._class && this._type === col._type && this.getAlpha() === col.getAlpha() && Base.equals(this._components, col._components) || false;
			},

			toString: function () {
				var properties = this._properties,
				    parts = [],
				    isGradient = this._type === 'gradient',
				    f = Formatter.instance;
				for (var i = 0, l = properties.length; i < l; i++) {
					var value = this._components[i];
					if (value != null) parts.push(properties[i] + ': ' + (isGradient ? value : f.number(value)));
				}
				if (this._alpha != null) parts.push('alpha: ' + f.number(this._alpha));
				return '{ ' + parts.join(', ') + ' }';
			},

			toCSS: function (hex) {
				var components = this._convert('rgb'),
				    alpha = hex || this._alpha == null ? 1 : this._alpha;
				function convert(val) {
					return Math.round((val < 0 ? 0 : val > 1 ? 1 : val) * 255);
				}
				components = [convert(components[0]), convert(components[1]), convert(components[2])];
				if (alpha < 1) components.push(alpha < 0 ? 0 : alpha);
				return hex ? '#' + ((1 << 24) + (components[0] << 16) + (components[1] << 8) + components[2]).toString(16).slice(1) : (components.length == 4 ? 'rgba(' : 'rgb(') + components.join(',') + ')';
			},

			toCanvasStyle: function (ctx) {
				if (this._canvasStyle) return this._canvasStyle;
				if (this._type !== 'gradient') return this._canvasStyle = this.toCSS();
				var components = this._components,
				    gradient = components[0],
				    stops = gradient._stops,
				    origin = components[1],
				    destination = components[2],
				    canvasGradient;
				if (gradient._radial) {
					var radius = destination.getDistance(origin),
					    highlight = components[3];
					if (highlight) {
						var vector = highlight.subtract(origin);
						if (vector.getLength() > radius) highlight = origin.add(vector.normalize(radius - 0.1));
					}
					var start = highlight || origin;
					canvasGradient = ctx.createRadialGradient(start.x, start.y, 0, origin.x, origin.y, radius);
				} else {
					canvasGradient = ctx.createLinearGradient(origin.x, origin.y, destination.x, destination.y);
				}
				for (var i = 0, l = stops.length; i < l; i++) {
					var stop = stops[i],
					    offset = stop._offset;
					canvasGradient.addColorStop(offset == null ? i / (l - 1) : offset, stop._color.toCanvasStyle());
				}
				return this._canvasStyle = canvasGradient;
			},

			transform: function (matrix) {
				if (this._type === 'gradient') {
					var components = this._components;
					for (var i = 1, l = components.length; i < l; i++) {
						var point = components[i];
						matrix._transformPoint(point, point, true);
					}
					this._changed();
				}
			},

			statics: {
				_types: types,

				random: function () {
					var random = Math.random;
					return new Color(random(), random(), random());
				}
			}
		});
	}(), new function () {
		var operators = {
			add: function (a, b) {
				return a + b;
			},

			subtract: function (a, b) {
				return a - b;
			},

			multiply: function (a, b) {
				return a * b;
			},

			divide: function (a, b) {
				return a / b;
			}
		};

		return Base.each(operators, function (operator, name) {
			this[name] = function (color) {
				color = Color.read(arguments);
				var type = this._type,
				    components1 = this._components,
				    components2 = color._convert(type);
				for (var i = 0, l = components1.length; i < l; i++) components2[i] = operator(components1[i], components2[i]);
				return new Color(type, components2, this._alpha != null ? operator(this._alpha, color.getAlpha()) : null);
			};
		}, {});
	}());

	var Gradient = Base.extend({
		_class: 'Gradient',

		initialize: function Gradient(stops, radial) {
			this._id = UID.get();
			if (stops && Base.isPlainObject(stops)) {
				this.set(stops);
				stops = radial = null;
			}
			if (this._stops == null) {
				this.setStops(stops || ['white', 'black']);
			}
			if (this._radial == null) {
				this.setRadial(typeof radial === 'string' && radial === 'radial' || radial || false);
			}
		},

		_serialize: function (options, dictionary) {
			return dictionary.add(this, function () {
				return Base.serialize([this._stops, this._radial], options, true, dictionary);
			});
		},

		_changed: function () {
			for (var i = 0, l = this._owners && this._owners.length; i < l; i++) {
				this._owners[i]._changed();
			}
		},

		_addOwner: function (color) {
			if (!this._owners) this._owners = [];
			this._owners.push(color);
		},

		_removeOwner: function (color) {
			var index = this._owners ? this._owners.indexOf(color) : -1;
			if (index != -1) {
				this._owners.splice(index, 1);
				if (!this._owners.length) this._owners = undefined;
			}
		},

		clone: function () {
			var stops = [];
			for (var i = 0, l = this._stops.length; i < l; i++) {
				stops[i] = this._stops[i].clone();
			}
			return new Gradient(stops, this._radial);
		},

		getStops: function () {
			return this._stops;
		},

		setStops: function (stops) {
			if (stops.length < 2) {
				throw new Error('Gradient stop list needs to contain at least two stops.');
			}
			var _stops = this._stops;
			if (_stops) {
				for (var i = 0, l = _stops.length; i < l; i++) _stops[i]._owner = undefined;
			}
			_stops = this._stops = GradientStop.readList(stops, 0, { clone: true });
			for (var i = 0, l = _stops.length; i < l; i++) _stops[i]._owner = this;
			this._changed();
		},

		getRadial: function () {
			return this._radial;
		},

		setRadial: function (radial) {
			this._radial = radial;
			this._changed();
		},

		equals: function (gradient) {
			if (gradient === this) return true;
			if (gradient && this._class === gradient._class) {
				var stops1 = this._stops,
				    stops2 = gradient._stops,
				    length = stops1.length;
				if (length === stops2.length) {
					for (var i = 0; i < length; i++) {
						if (!stops1[i].equals(stops2[i])) return false;
					}
					return true;
				}
			}
			return false;
		}
	});

	var GradientStop = Base.extend({
		_class: 'GradientStop',

		initialize: function GradientStop(arg0, arg1) {
			var color = arg0,
			    offset = arg1;
			if (typeof arg0 === 'object' && arg1 === undefined) {
				if (Array.isArray(arg0) && typeof arg0[0] !== 'number') {
					color = arg0[0];
					offset = arg0[1];
				} else if ('color' in arg0 || 'offset' in arg0 || 'rampPoint' in arg0) {
					color = arg0.color;
					offset = arg0.offset || arg0.rampPoint || 0;
				}
			}
			this.setColor(color);
			this.setOffset(offset);
		},

		clone: function () {
			return new GradientStop(this._color.clone(), this._offset);
		},

		_serialize: function (options, dictionary) {
			var color = this._color,
			    offset = this._offset;
			return Base.serialize(offset == null ? [color] : [color, offset], options, true, dictionary);
		},

		_changed: function () {
			if (this._owner) this._owner._changed(65);
		},

		getOffset: function () {
			return this._offset;
		},

		setOffset: function (offset) {
			this._offset = offset;
			this._changed();
		},

		getRampPoint: '#getOffset',
		setRampPoint: '#setOffset',

		getColor: function () {
			return this._color;
		},

		setColor: function () {
			var color = Color.read(arguments, 0, { clone: true });
			if (color) color._owner = this;
			this._color = color;
			this._changed();
		},

		equals: function (stop) {
			return stop === this || stop && this._class === stop._class && this._color.equals(stop._color) && this._offset == stop._offset || false;
		}
	});

	var Style = Base.extend(new function () {
		var itemDefaults = {
			fillColor: null,
			fillRule: 'nonzero',
			strokeColor: null,
			strokeWidth: 1,
			strokeCap: 'butt',
			strokeJoin: 'miter',
			strokeScaling: true,
			miterLimit: 10,
			dashOffset: 0,
			dashArray: [],
			shadowColor: null,
			shadowBlur: 0,
			shadowOffset: new Point(),
			selectedColor: null
		},
		    groupDefaults = Base.set({}, itemDefaults, {
			fontFamily: 'sans-serif',
			fontWeight: 'normal',
			fontSize: 12,
			leading: null,
			justification: 'left'
		}),
		    textDefaults = Base.set({}, groupDefaults, {
			fillColor: new Color()
		}),
		    flags = {
			strokeWidth: 97,
			strokeCap: 97,
			strokeJoin: 97,
			strokeScaling: 105,
			miterLimit: 97,
			fontFamily: 9,
			fontWeight: 9,
			fontSize: 9,
			font: 9,
			leading: 9,
			justification: 9
		},
		    item = {
			beans: true
		},
		    fields = {
			_class: 'Style',
			beans: true,

			initialize: function Style(style, _owner, _project) {
				this._values = {};
				this._owner = _owner;
				this._project = _owner && _owner._project || _project || paper.project;
				this._defaults = !_owner || _owner instanceof Group ? groupDefaults : _owner instanceof TextItem ? textDefaults : itemDefaults;
				if (style) this.set(style);
			}
		};

		Base.each(groupDefaults, function (value, key) {
			var isColor = /Color$/.test(key),
			    isPoint = key === 'shadowOffset',
			    part = Base.capitalize(key),
			    flag = flags[key],
			    set = 'set' + part,
			    get = 'get' + part;

			fields[set] = function (value) {
				var owner = this._owner,
				    children = owner && owner._children;
				if (children && children.length > 0 && !(owner instanceof CompoundPath)) {
					for (var i = 0, l = children.length; i < l; i++) children[i]._style[set](value);
				} else if (key in this._defaults) {
					var old = this._values[key];
					if (old !== value) {
						if (isColor) {
							if (old && old._owner !== undefined) old._owner = undefined;
							if (value && value.constructor === Color) {
								if (value._owner) value = value.clone();
								value._owner = owner;
							}
						}
						this._values[key] = value;
						if (owner) owner._changed(flag || 65);
					}
				}
			};

			fields[get] = function (_dontMerge) {
				var owner = this._owner,
				    children = owner && owner._children,
				    value;
				if (key in this._defaults && (!children || !children.length || _dontMerge || owner instanceof CompoundPath)) {
					var value = this._values[key];
					if (value === undefined) {
						value = this._defaults[key];
						if (value && value.clone) value = value.clone();
					} else {
						var ctor = isColor ? Color : isPoint ? Point : null;
						if (ctor && !(value && value.constructor === ctor)) {
							this._values[key] = value = ctor.read([value], 0, { readNull: true, clone: true });
							if (value && isColor) value._owner = owner;
						}
					}
				} else if (children) {
					for (var i = 0, l = children.length; i < l; i++) {
						var childValue = children[i]._style[get]();
						if (!i) {
							value = childValue;
						} else if (!Base.equals(value, childValue)) {
							return undefined;
						}
					}
				}
				return value;
			};

			item[get] = function (_dontMerge) {
				return this._style[get](_dontMerge);
			};

			item[set] = function (value) {
				this._style[set](value);
			};
		});

		Base.each({
			Font: 'FontFamily',
			WindingRule: 'FillRule'
		}, function (value, key) {
			var get = 'get' + key,
			    set = 'set' + key;
			fields[get] = item[get] = '#get' + value;
			fields[set] = item[set] = '#set' + value;
		});

		Item.inject(item);
		return fields;
	}(), {
		set: function (style) {
			this._values = {};
			var isStyle = style instanceof Style,
			    values = isStyle ? style._values : style;
			if (values) {
				for (var key in values) {
					if (key in this._defaults) {
						var value = values[key];
						this[key] = value && isStyle && value.clone ? value.clone() : value;
					}
				}
			}
		},

		equals: function (style) {
			function compare(style1, style2, secondary) {
				var values1 = style1._values,
				    values2 = style2._values,
				    defaults2 = style2._defaults;
				for (var key in values1) {
					var value1 = values1[key],
					    value2 = values2[key];
					if (!(secondary && key in values2) && !Base.equals(value1, value2 === undefined ? defaults2[key] : value2)) return false;
				}
				return true;
			}

			return style === this || style && this._class === style._class && compare(this, style) && compare(style, this, true) || false;
		},

		hasFill: function () {
			var color = this.getFillColor();
			return !!color && color.alpha > 0;
		},

		hasStroke: function () {
			var color = this.getStrokeColor();
			return !!color && color.alpha > 0 && this.getStrokeWidth() > 0;
		},

		hasShadow: function () {
			var color = this.getShadowColor();
			return !!color && color.alpha > 0 && (this.getShadowBlur() > 0 || !this.getShadowOffset().isZero());
		},

		getView: function () {
			return this._project._view;
		},

		getFontStyle: function () {
			var fontSize = this.getFontSize();
			return this.getFontWeight() + ' ' + fontSize + (/[a-z]/i.test(fontSize + '') ? ' ' : 'px ') + this.getFontFamily();
		},

		getFont: '#getFontFamily',
		setFont: '#setFontFamily',

		getLeading: function getLeading() {
			var leading = getLeading.base.call(this),
			    fontSize = this.getFontSize();
			if (/pt|em|%|px/.test(fontSize)) fontSize = this.getView().getPixelSize(fontSize);
			return leading != null ? leading : fontSize * 1.2;
		}

	});

	var DomElement = new function () {
		function handlePrefix(el, name, set, value) {
			var prefixes = ['', 'webkit', 'moz', 'Moz', 'ms', 'o'],
			    suffix = name[0].toUpperCase() + name.substring(1);
			for (var i = 0; i < 6; i++) {
				var prefix = prefixes[i],
				    key = prefix ? prefix + suffix : name;
				if (key in el) {
					if (set) {
						el[key] = value;
					} else {
						return el[key];
					}
					break;
				}
			}
		}

		return {
			getStyles: function (el) {
				var doc = el && el.nodeType !== 9 ? el.ownerDocument : el,
				    view = doc && doc.defaultView;
				return view && view.getComputedStyle(el, '');
			},

			getBounds: function (el, viewport) {
				var doc = el.ownerDocument,
				    body = doc.body,
				    html = doc.documentElement,
				    rect;
				try {
					rect = el.getBoundingClientRect();
				} catch (e) {
					rect = { left: 0, top: 0, width: 0, height: 0 };
				}
				var x = rect.left - (html.clientLeft || body.clientLeft || 0),
				    y = rect.top - (html.clientTop || body.clientTop || 0);
				if (!viewport) {
					var view = doc.defaultView;
					x += view.pageXOffset || html.scrollLeft || body.scrollLeft;
					y += view.pageYOffset || html.scrollTop || body.scrollTop;
				}
				return new Rectangle(x, y, rect.width, rect.height);
			},

			getViewportBounds: function (el) {
				var doc = el.ownerDocument,
				    view = doc.defaultView,
				    html = doc.documentElement;
				return new Rectangle(0, 0, view.innerWidth || html.clientWidth, view.innerHeight || html.clientHeight);
			},

			getOffset: function (el, viewport) {
				return DomElement.getBounds(el, viewport).getPoint();
			},

			getSize: function (el) {
				return DomElement.getBounds(el, true).getSize();
			},

			isInvisible: function (el) {
				return DomElement.getSize(el).equals(new Size(0, 0));
			},

			isInView: function (el) {
				return !DomElement.isInvisible(el) && DomElement.getViewportBounds(el).intersects(DomElement.getBounds(el, true));
			},

			isInserted: function (el) {
				return document.body.contains(el);
			},

			getPrefixed: function (el, name) {
				return el && handlePrefix(el, name);
			},

			setPrefixed: function (el, name, value) {
				if (typeof name === 'object') {
					for (var key in name) handlePrefix(el, key, true, name[key]);
				} else {
					handlePrefix(el, name, true, value);
				}
			}
		};
	}();

	var DomEvent = {
		add: function (el, events) {
			if (el) {
				for (var type in events) {
					var func = events[type],
					    parts = type.split(/[\s,]+/g);
					for (var i = 0, l = parts.length; i < l; i++) el.addEventListener(parts[i], func, false);
				}
			}
		},

		remove: function (el, events) {
			if (el) {
				for (var type in events) {
					var func = events[type],
					    parts = type.split(/[\s,]+/g);
					for (var i = 0, l = parts.length; i < l; i++) el.removeEventListener(parts[i], func, false);
				}
			}
		},

		getPoint: function (event) {
			var pos = event.targetTouches ? event.targetTouches.length ? event.targetTouches[0] : event.changedTouches[0] : event;
			return new Point(pos.pageX || pos.clientX + document.documentElement.scrollLeft, pos.pageY || pos.clientY + document.documentElement.scrollTop);
		},

		getTarget: function (event) {
			return event.target || event.srcElement;
		},

		getRelatedTarget: function (event) {
			return event.relatedTarget || event.toElement;
		},

		getOffset: function (event, target) {
			return DomEvent.getPoint(event).subtract(DomElement.getOffset(target || DomEvent.getTarget(event)));
		}
	};

	DomEvent.requestAnimationFrame = new function () {
		var nativeRequest = DomElement.getPrefixed(window, 'requestAnimationFrame'),
		    requested = false,
		    callbacks = [],
		    timer;

		function handleCallbacks() {
			var functions = callbacks;
			callbacks = [];
			for (var i = 0, l = functions.length; i < l; i++) functions[i]();
			requested = nativeRequest && callbacks.length;
			if (requested) nativeRequest(handleCallbacks);
		}

		return function (callback) {
			callbacks.push(callback);
			if (nativeRequest) {
				if (!requested) {
					nativeRequest(handleCallbacks);
					requested = true;
				}
			} else if (!timer) {
				timer = setInterval(handleCallbacks, 1000 / 60);
			}
		};
	}();

	var View = Base.extend(Emitter, {
		_class: 'View',

		initialize: function View(project, element) {

			function getSize(name) {
				return element[name] || parseInt(element.getAttribute(name), 10);
			}

			function getCanvasSize() {
				var size = DomElement.getSize(element);
				return size.isNaN() || size.isZero() ? new Size(getSize('width'), getSize('height')) : size;
			}

			var size;
			if (window && element) {
				this._id = element.getAttribute('id');
				if (this._id == null) element.setAttribute('id', this._id = 'view-' + View._id++);
				DomEvent.add(element, this._viewEvents);
				var none = 'none';
				DomElement.setPrefixed(element.style, {
					userDrag: none,
					userSelect: none,
					touchCallout: none,
					contentZooming: none,
					tapHighlightColor: 'rgba(0,0,0,0)'
				});

				if (PaperScope.hasAttribute(element, 'resize')) {
					var that = this;
					DomEvent.add(window, this._windowEvents = {
						resize: function () {
							that.setViewSize(getCanvasSize());
						}
					});
				}

				size = getCanvasSize();

				if (PaperScope.hasAttribute(element, 'stats') && typeof Stats !== 'undefined') {
					this._stats = new Stats();
					var stats = this._stats.domElement,
					    style = stats.style,
					    offset = DomElement.getOffset(element);
					style.position = 'absolute';
					style.left = offset.x + 'px';
					style.top = offset.y + 'px';
					document.body.appendChild(stats);
				}
			} else {
				size = new Size(element);
				element = null;
			}
			this._project = project;
			this._scope = project._scope;
			this._element = element;
			if (!this._pixelRatio) this._pixelRatio = window && window.devicePixelRatio || 1;
			this._setElementSize(size.width, size.height);
			this._viewSize = size;
			View._views.push(this);
			View._viewsById[this._id] = this;
			(this._matrix = new Matrix())._owner = this;
			if (!View._focused) View._focused = this;
			this._frameItems = {};
			this._frameItemCount = 0;
			this._itemEvents = { native: {}, virtual: {} };
			this._autoUpdate = !paper.agent.node;
			this._needsUpdate = false;
		},

		remove: function () {
			if (!this._project) return false;
			if (View._focused === this) View._focused = null;
			View._views.splice(View._views.indexOf(this), 1);
			delete View._viewsById[this._id];
			var project = this._project;
			if (project._view === this) project._view = null;
			DomEvent.remove(this._element, this._viewEvents);
			DomEvent.remove(window, this._windowEvents);
			this._element = this._project = null;
			this.off('frame');
			this._animate = false;
			this._frameItems = {};
			return true;
		},

		_events: Base.each(Item._itemHandlers.concat(['onResize', 'onKeyDown', 'onKeyUp']), function (name) {
			this[name] = {};
		}, {
			onFrame: {
				install: function () {
					this.play();
				},

				uninstall: function () {
					this.pause();
				}
			}
		}),

		_animate: false,
		_time: 0,
		_count: 0,

		getAutoUpdate: function () {
			return this._autoUpdate;
		},

		setAutoUpdate: function (autoUpdate) {
			this._autoUpdate = autoUpdate;
			if (autoUpdate) this.requestUpdate();
		},

		update: function () {},

		draw: function () {
			this.update();
		},

		requestUpdate: function () {
			if (!this._requested) {
				var that = this;
				DomEvent.requestAnimationFrame(function () {
					that._requested = false;
					if (that._animate) {
						that.requestUpdate();
						var element = that._element;
						if ((!DomElement.getPrefixed(document, 'hidden') || PaperScope.getAttribute(element, 'keepalive') === 'true') && DomElement.isInView(element)) {
							that._handleFrame();
						}
					}
					if (that._autoUpdate) that.update();
				});
				this._requested = true;
			}
		},

		play: function () {
			this._animate = true;
			this.requestUpdate();
		},

		pause: function () {
			this._animate = false;
		},

		_handleFrame: function () {
			paper = this._scope;
			var now = Date.now() / 1000,
			    delta = this._last ? now - this._last : 0;
			this._last = now;
			this.emit('frame', new Base({
				delta: delta,
				time: this._time += delta,
				count: this._count++
			}));
			if (this._stats) this._stats.update();
		},

		_animateItem: function (item, animate) {
			var items = this._frameItems;
			if (animate) {
				items[item._id] = {
					item: item,
					time: 0,
					count: 0
				};
				if (++this._frameItemCount === 1) this.on('frame', this._handleFrameItems);
			} else {
				delete items[item._id];
				if (--this._frameItemCount === 0) {
					this.off('frame', this._handleFrameItems);
				}
			}
		},

		_handleFrameItems: function (event) {
			for (var i in this._frameItems) {
				var entry = this._frameItems[i];
				entry.item.emit('frame', new Base(event, {
					time: entry.time += event.delta,
					count: entry.count++
				}));
			}
		},

		_changed: function () {
			this._project._changed(2049);
			this._bounds = this._decomposed = undefined;
		},

		getElement: function () {
			return this._element;
		},

		getPixelRatio: function () {
			return this._pixelRatio;
		},

		getResolution: function () {
			return this._pixelRatio * 72;
		},

		getViewSize: function () {
			var size = this._viewSize;
			return new LinkedSize(size.width, size.height, this, 'setViewSize');
		},

		setViewSize: function () {
			var size = Size.read(arguments),
			    delta = size.subtract(this._viewSize);
			if (delta.isZero()) return;
			this._setElementSize(size.width, size.height);
			this._viewSize.set(size);
			this._changed();
			this.emit('resize', { size: size, delta: delta });
			if (this._autoUpdate) {
				this.update();
			}
		},

		_setElementSize: function (width, height) {
			var element = this._element;
			if (element) {
				if (element.width !== width) element.width = width;
				if (element.height !== height) element.height = height;
			}
		},

		getBounds: function () {
			if (!this._bounds) this._bounds = this._matrix.inverted()._transformBounds(new Rectangle(new Point(), this._viewSize));
			return this._bounds;
		},

		getSize: function () {
			return this.getBounds().getSize();
		},

		isVisible: function () {
			return DomElement.isInView(this._element);
		},

		isInserted: function () {
			return DomElement.isInserted(this._element);
		},

		getPixelSize: function (size) {
			var element = this._element,
			    pixels;
			if (element) {
				var parent = element.parentNode,
				    temp = document.createElement('div');
				temp.style.fontSize = size;
				parent.appendChild(temp);
				pixels = parseFloat(DomElement.getStyles(temp).fontSize);
				parent.removeChild(temp);
			} else {
				pixels = parseFloat(pixels);
			}
			return pixels;
		},

		getTextWidth: function (font, lines) {
			return 0;
		}
	}, Base.each(['rotate', 'scale', 'shear', 'skew'], function (key) {
		var rotate = key === 'rotate';
		this[key] = function () {
			var value = (rotate ? Base : Point).read(arguments),
			    center = Point.read(arguments, 0, { readNull: true });
			return this.transform(new Matrix()[key](value, center || this.getCenter(true)));
		};
	}, {
		_decompose: function () {
			return this._decomposed || (this._decomposed = this._matrix.decompose());
		},

		translate: function () {
			var mx = new Matrix();
			return this.transform(mx.translate.apply(mx, arguments));
		},

		getCenter: function () {
			return this.getBounds().getCenter();
		},

		setCenter: function () {
			var center = Point.read(arguments);
			this.translate(this.getCenter().subtract(center));
		},

		getZoom: function () {
			var decomposed = this._decompose(),
			    scaling = decomposed && decomposed.scaling;
			return scaling ? (scaling.x + scaling.y) / 2 : 0;
		},

		setZoom: function (zoom) {
			this.transform(new Matrix().scale(zoom / this.getZoom(), this.getCenter()));
		},

		getRotation: function () {
			var decomposed = this._decompose();
			return decomposed && decomposed.rotation;
		},

		setRotation: function (rotation) {
			var current = this.getRotation();
			if (current != null && rotation != null) {
				this.rotate(rotation - current);
			}
		},

		getScaling: function () {
			var decomposed = this._decompose(),
			    scaling = decomposed && decomposed.scaling;
			return scaling ? new LinkedPoint(scaling.x, scaling.y, this, 'setScaling') : undefined;
		},

		setScaling: function () {
			var current = this.getScaling(),
			    scaling = Point.read(arguments, 0, { clone: true, readNull: true });
			if (current && scaling) {
				this.scale(scaling.x / current.x, scaling.y / current.y);
			}
		},

		getMatrix: function () {
			return this._matrix;
		},

		setMatrix: function () {
			var matrix = this._matrix;
			matrix.initialize.apply(matrix, arguments);
		},

		transform: function (matrix) {
			this._matrix.append(matrix);
		},

		scrollBy: function () {
			this.translate(Point.read(arguments).negate());
		}
	}), {

		projectToView: function () {
			return this._matrix._transformPoint(Point.read(arguments));
		},

		viewToProject: function () {
			return this._matrix._inverseTransform(Point.read(arguments));
		},

		getEventPoint: function (event) {
			return this.viewToProject(DomEvent.getOffset(event, this._element));
		}

	}, {
		statics: {
			_views: [],
			_viewsById: {},
			_id: 0,

			create: function (project, element) {
				if (document && typeof element === 'string') element = document.getElementById(element);
				var ctor = window ? CanvasView : View;
				return new ctor(project, element);
			}
		}
	}, new function () {
		if (!window) return;
		var prevFocus,
		    tempFocus,
		    dragging = false,
		    mouseDown = false;

		function getView(event) {
			var target = DomEvent.getTarget(event);
			return target.getAttribute && View._viewsById[target.getAttribute('id')];
		}

		function updateFocus() {
			var view = View._focused;
			if (!view || !view.isVisible()) {
				for (var i = 0, l = View._views.length; i < l; i++) {
					if ((view = View._views[i]).isVisible()) {
						View._focused = tempFocus = view;
						break;
					}
				}
			}
		}

		function handleMouseMove(view, event, point) {
			view._handleMouseEvent('mousemove', event, point);
		}

		var navigator = window.navigator,
		    mousedown,
		    mousemove,
		    mouseup;
		if (navigator.pointerEnabled || navigator.msPointerEnabled) {
			mousedown = 'pointerdown MSPointerDown';
			mousemove = 'pointermove MSPointerMove';
			mouseup = 'pointerup pointercancel MSPointerUp MSPointerCancel';
		} else {
			mousedown = 'touchstart';
			mousemove = 'touchmove';
			mouseup = 'touchend touchcancel';
			if (!('ontouchstart' in window && navigator.userAgent.match(/mobile|tablet|ip(ad|hone|od)|android|silk/i))) {
				mousedown += ' mousedown';
				mousemove += ' mousemove';
				mouseup += ' mouseup';
			}
		}

		var viewEvents = {},
		    docEvents = {
			mouseout: function (event) {
				var view = View._focused,
				    target = DomEvent.getRelatedTarget(event);
				if (view && (!target || target.nodeName === 'HTML')) {
					var offset = DomEvent.getOffset(event, view._element),
					    x = offset.x,
					    abs = Math.abs,
					    ax = abs(x),
					    max = 1 << 25,
					    diff = ax - max;
					offset.x = abs(diff) < ax ? diff * (x < 0 ? -1 : 1) : x;
					handleMouseMove(view, event, view.viewToProject(offset));
				}
			},

			scroll: updateFocus
		};

		viewEvents[mousedown] = function (event) {
			var view = View._focused = getView(event);
			if (!dragging) {
				dragging = true;
				view._handleMouseEvent('mousedown', event);
			}
		};

		docEvents[mousemove] = function (event) {
			var view = View._focused;
			if (!mouseDown) {
				var target = getView(event);
				if (target) {
					if (view !== target) {
						if (view) handleMouseMove(view, event);
						if (!prevFocus) prevFocus = view;
						view = View._focused = tempFocus = target;
					}
				} else if (tempFocus && tempFocus === view) {
					if (prevFocus && !prevFocus.isInserted()) prevFocus = null;
					view = View._focused = prevFocus;
					prevFocus = null;
					updateFocus();
				}
			}
			if (view) handleMouseMove(view, event);
		};

		docEvents[mousedown] = function () {
			mouseDown = true;
		};

		docEvents[mouseup] = function (event) {
			var view = View._focused;
			if (view && dragging) view._handleMouseEvent('mouseup', event);
			mouseDown = dragging = false;
		};

		DomEvent.add(document, docEvents);

		DomEvent.add(window, {
			load: updateFocus
		});

		var called = false,
		    prevented = false,
		    fallbacks = {
			doubleclick: 'click',
			mousedrag: 'mousemove'
		},
		    wasInView = false,
		    overView,
		    downPoint,
		    lastPoint,
		    downItem,
		    overItem,
		    dragItem,
		    clickItem,
		    clickTime,
		    dblClick;

		function emitMouseEvent(obj, target, type, event, point, prevPoint, stopItem) {
			var stopped = false,
			    mouseEvent;

			function emit(obj, type) {
				if (obj.responds(type)) {
					if (!mouseEvent) {
						mouseEvent = new MouseEvent(type, event, point, target || obj, prevPoint ? point.subtract(prevPoint) : null);
					}
					if (obj.emit(type, mouseEvent)) {
						called = true;
						if (mouseEvent.prevented) prevented = true;
						if (mouseEvent.stopped) return stopped = true;
					}
				} else {
					var fallback = fallbacks[type];
					if (fallback) return emit(obj, fallback);
				}
			}

			while (obj && obj !== stopItem) {
				if (emit(obj, type)) break;
				obj = obj._parent;
			}
			return stopped;
		}

		function emitMouseEvents(view, hitItem, type, event, point, prevPoint) {
			view._project.removeOn(type);
			prevented = called = false;
			return dragItem && emitMouseEvent(dragItem, null, type, event, point, prevPoint) || hitItem && hitItem !== dragItem && !hitItem.isDescendant(dragItem) && emitMouseEvent(hitItem, null, fallbacks[type] || type, event, point, prevPoint, dragItem) || emitMouseEvent(view, dragItem || hitItem || view, type, event, point, prevPoint);
		}

		var itemEventsMap = {
			mousedown: {
				mousedown: 1,
				mousedrag: 1,
				click: 1,
				doubleclick: 1
			},
			mouseup: {
				mouseup: 1,
				mousedrag: 1,
				click: 1,
				doubleclick: 1
			},
			mousemove: {
				mousedrag: 1,
				mousemove: 1,
				mouseenter: 1,
				mouseleave: 1
			}
		};

		return {
			_viewEvents: viewEvents,

			_handleMouseEvent: function (type, event, point) {
				var itemEvents = this._itemEvents,
				    hitItems = itemEvents.native[type],
				    nativeMove = type === 'mousemove',
				    tool = this._scope.tool,
				    view = this;

				function responds(type) {
					return itemEvents.virtual[type] || view.responds(type) || tool && tool.responds(type);
				}

				if (nativeMove && dragging && responds('mousedrag')) type = 'mousedrag';
				if (!point) point = this.getEventPoint(event);

				var inView = this.getBounds().contains(point),
				    hit = hitItems && inView && view._project.hitTest(point, {
					tolerance: 0,
					fill: true,
					stroke: true
				}),
				    hitItem = hit && hit.item || null,
				    handle = false,
				    mouse = {};
				mouse[type.substr(5)] = true;

				if (hitItems && hitItem !== overItem) {
					if (overItem) {
						emitMouseEvent(overItem, null, 'mouseleave', event, point);
					}
					if (hitItem) {
						emitMouseEvent(hitItem, null, 'mouseenter', event, point);
					}
					overItem = hitItem;
				}
				if (wasInView ^ inView) {
					emitMouseEvent(this, null, inView ? 'mouseenter' : 'mouseleave', event, point);
					overView = inView ? this : null;
					handle = true;
				}
				if ((inView || mouse.drag) && !point.equals(lastPoint)) {
					emitMouseEvents(this, hitItem, nativeMove ? type : 'mousemove', event, point, lastPoint);
					handle = true;
				}
				wasInView = inView;
				if (mouse.down && inView || mouse.up && downPoint) {
					emitMouseEvents(this, hitItem, type, event, point, downPoint);
					if (mouse.down) {
						dblClick = hitItem === clickItem && Date.now() - clickTime < 300;
						downItem = clickItem = hitItem;
						dragItem = !prevented && hitItem;
						downPoint = point;
					} else if (mouse.up) {
						if (!prevented && hitItem === downItem) {
							clickTime = Date.now();
							emitMouseEvents(this, hitItem, dblClick ? 'doubleclick' : 'click', event, point, downPoint);
							dblClick = false;
						}
						downItem = dragItem = null;
					}
					wasInView = false;
					handle = true;
				}
				lastPoint = point;
				if (handle && tool) {
					called = tool._handleMouseEvent(type, event, point, mouse) || called;
				}

				if (called && !mouse.move || mouse.down && responds('mouseup')) event.preventDefault();
			},

			_handleKeyEvent: function (type, event, key, character) {
				var scope = this._scope,
				    tool = scope.tool,
				    keyEvent;

				function emit(obj) {
					if (obj.responds(type)) {
						paper = scope;
						obj.emit(type, keyEvent = keyEvent || new KeyEvent(type, event, key, character));
					}
				}

				if (this.isVisible()) {
					emit(this);
					if (tool && tool.responds(type)) emit(tool);
				}
			},

			_countItemEvent: function (type, sign) {
				var itemEvents = this._itemEvents,
				    native = itemEvents.native,
				    virtual = itemEvents.virtual;
				for (var key in itemEventsMap) {
					native[key] = (native[key] || 0) + (itemEventsMap[key][type] || 0) * sign;
				}
				virtual[type] = (virtual[type] || 0) + sign;
			},

			statics: {
				updateFocus: updateFocus
			}
		};
	}());

	var CanvasView = View.extend({
		_class: 'CanvasView',

		initialize: function CanvasView(project, canvas) {
			if (!(canvas instanceof window.HTMLCanvasElement)) {
				var size = Size.read(arguments, 1);
				if (size.isZero()) throw new Error('Cannot create CanvasView with the provided argument: ' + Base.slice(arguments, 1));
				canvas = CanvasProvider.getCanvas(size);
			}
			var ctx = this._context = canvas.getContext('2d');
			ctx.save();
			this._pixelRatio = 1;
			if (!/^off|false$/.test(PaperScope.getAttribute(canvas, 'hidpi'))) {
				var deviceRatio = window.devicePixelRatio || 1,
				    backingStoreRatio = DomElement.getPrefixed(ctx, 'backingStorePixelRatio') || 1;
				this._pixelRatio = deviceRatio / backingStoreRatio;
			}
			View.call(this, project, canvas);
			this._needsUpdate = true;
		},

		remove: function remove() {
			this._context.restore();
			return remove.base.call(this);
		},

		_setElementSize: function _setElementSize(width, height) {
			var pixelRatio = this._pixelRatio;
			_setElementSize.base.call(this, width * pixelRatio, height * pixelRatio);
			if (pixelRatio !== 1) {
				var element = this._element,
				    ctx = this._context;
				if (!PaperScope.hasAttribute(element, 'resize')) {
					var style = element.style;
					style.width = width + 'px';
					style.height = height + 'px';
				}
				ctx.restore();
				ctx.save();
				ctx.scale(pixelRatio, pixelRatio);
			}
		},

		getPixelSize: function getPixelSize(size) {
			var agent = paper.agent,
			    pixels;
			if (agent && agent.firefox) {
				pixels = getPixelSize.base.call(this, size);
			} else {
				var ctx = this._context,
				    prevFont = ctx.font;
				ctx.font = size + ' serif';
				pixels = parseFloat(ctx.font);
				ctx.font = prevFont;
			}
			return pixels;
		},

		getTextWidth: function (font, lines) {
			var ctx = this._context,
			    prevFont = ctx.font,
			    width = 0;
			ctx.font = font;
			for (var i = 0, l = lines.length; i < l; i++) width = Math.max(width, ctx.measureText(lines[i]).width);
			ctx.font = prevFont;
			return width;
		},

		update: function () {
			if (!this._needsUpdate) return false;
			var project = this._project,
			    ctx = this._context,
			    size = this._viewSize;
			ctx.clearRect(0, 0, size.width + 1, size.height + 1);
			if (project) project.draw(ctx, this._matrix, this._pixelRatio);
			this._needsUpdate = false;
			return true;
		}
	});

	var Event = Base.extend({
		_class: 'Event',

		initialize: function Event(event) {
			this.event = event;
			this.type = event && event.type;
		},

		prevented: false,
		stopped: false,

		preventDefault: function () {
			this.prevented = true;
			this.event.preventDefault();
		},

		stopPropagation: function () {
			this.stopped = true;
			this.event.stopPropagation();
		},

		stop: function () {
			this.stopPropagation();
			this.preventDefault();
		},

		getTimeStamp: function () {
			return this.event.timeStamp;
		},

		getModifiers: function () {
			return Key.modifiers;
		}
	});

	var KeyEvent = Event.extend({
		_class: 'KeyEvent',

		initialize: function KeyEvent(type, event, key, character) {
			this.type = type;
			this.event = event;
			this.key = key;
			this.character = character;
		},

		toString: function () {
			return "{ type: '" + this.type + "', key: '" + this.key + "', character: '" + this.character + "', modifiers: " + this.getModifiers() + " }";
		}
	});

	var Key = new function () {
		var keyLookup = {
			'\t': 'tab',
			' ': 'space',
			'\b': 'backspace',
			'\x7f': 'delete',
			'Spacebar': 'space',
			'Del': 'delete',
			'Win': 'meta',
			'Esc': 'escape'
		},
		    charLookup = {
			'tab': '\t',
			'space': ' ',
			'enter': '\r'
		},
		    keyMap = {},
		    charMap = {},
		    metaFixMap,
		    downKey,
		    modifiers = new Base({
			shift: false,
			control: false,
			alt: false,
			meta: false,
			capsLock: false,
			space: false
		}).inject({
			option: {
				get: function () {
					return this.alt;
				}
			},

			command: {
				get: function () {
					var agent = paper && paper.agent;
					return agent && agent.mac ? this.meta : this.control;
				}
			}
		});

		function getKey(event) {
			var key = event.key || event.keyIdentifier;
			key = /^U\+/.test(key) ? String.fromCharCode(parseInt(key.substr(2), 16)) : /^Arrow[A-Z]/.test(key) ? key.substr(5) : key === 'Unidentified' ? String.fromCharCode(event.keyCode) : key;
			return keyLookup[key] || (key.length > 1 ? Base.hyphenate(key) : key.toLowerCase());
		}

		function handleKey(down, key, character, event) {
			var type = down ? 'keydown' : 'keyup',
			    view = View._focused,
			    name;
			keyMap[key] = down;
			if (down) {
				charMap[key] = character;
			} else {
				delete charMap[key];
			}
			if (key.length > 1 && (name = Base.camelize(key)) in modifiers) {
				modifiers[name] = down;
				var agent = paper && paper.agent;
				if (name === 'meta' && agent && agent.mac) {
					if (down) {
						metaFixMap = {};
					} else {
						for (var k in metaFixMap) {
							if (k in charMap) handleKey(false, k, metaFixMap[k], event);
						}
						metaFixMap = null;
					}
				}
			} else if (down && metaFixMap) {
				metaFixMap[key] = character;
			}
			if (view) {
				view._handleKeyEvent(down ? 'keydown' : 'keyup', event, key, character);
			}
		}

		DomEvent.add(document, {
			keydown: function (event) {
				var key = getKey(event),
				    agent = paper && paper.agent;
				if (key.length > 1 || agent && agent.chrome && (event.altKey || agent.mac && event.metaKey || !agent.mac && event.ctrlKey)) {
					handleKey(true, key, charLookup[key] || (key.length > 1 ? '' : key), event);
				} else {
					downKey = key;
				}
			},

			keypress: function (event) {
				if (downKey) {
					var key = getKey(event),
					    code = event.charCode,
					    character = code >= 32 ? String.fromCharCode(code) : key.length > 1 ? '' : key;
					if (key !== downKey) {
						key = character.toLowerCase();
					}
					handleKey(true, key, character, event);
					downKey = null;
				}
			},

			keyup: function (event) {
				var key = getKey(event);
				if (key in charMap) handleKey(false, key, charMap[key], event);
			}
		});

		DomEvent.add(window, {
			blur: function (event) {
				for (var key in charMap) handleKey(false, key, charMap[key], event);
			}
		});

		return {
			modifiers: modifiers,

			isDown: function (key) {
				return !!keyMap[key];
			}
		};
	}();

	var MouseEvent = Event.extend({
		_class: 'MouseEvent',

		initialize: function MouseEvent(type, event, point, target, delta) {
			this.type = type;
			this.event = event;
			this.point = point;
			this.target = target;
			this.delta = delta;
		},

		toString: function () {
			return "{ type: '" + this.type + "', point: " + this.point + ', target: ' + this.target + (this.delta ? ', delta: ' + this.delta : '') + ', modifiers: ' + this.getModifiers() + ' }';
		}
	});

	var ToolEvent = Event.extend({
		_class: 'ToolEvent',
		_item: null,

		initialize: function ToolEvent(tool, type, event) {
			this.tool = tool;
			this.type = type;
			this.event = event;
		},

		_choosePoint: function (point, toolPoint) {
			return point ? point : toolPoint ? toolPoint.clone() : null;
		},

		getPoint: function () {
			return this._choosePoint(this._point, this.tool._point);
		},

		setPoint: function (point) {
			this._point = point;
		},

		getLastPoint: function () {
			return this._choosePoint(this._lastPoint, this.tool._lastPoint);
		},

		setLastPoint: function (lastPoint) {
			this._lastPoint = lastPoint;
		},

		getDownPoint: function () {
			return this._choosePoint(this._downPoint, this.tool._downPoint);
		},

		setDownPoint: function (downPoint) {
			this._downPoint = downPoint;
		},

		getMiddlePoint: function () {
			if (!this._middlePoint && this.tool._lastPoint) {
				return this.tool._point.add(this.tool._lastPoint).divide(2);
			}
			return this._middlePoint;
		},

		setMiddlePoint: function (middlePoint) {
			this._middlePoint = middlePoint;
		},

		getDelta: function () {
			return !this._delta && this.tool._lastPoint ? this.tool._point.subtract(this.tool._lastPoint) : this._delta;
		},

		setDelta: function (delta) {
			this._delta = delta;
		},

		getCount: function () {
			return this.tool[/^mouse(down|up)$/.test(this.type) ? '_downCount' : '_moveCount'];
		},

		setCount: function (count) {
			this.tool[/^mouse(down|up)$/.test(this.type) ? 'downCount' : 'count'] = count;
		},

		getItem: function () {
			if (!this._item) {
				var result = this.tool._scope.project.hitTest(this.getPoint());
				if (result) {
					var item = result.item,
					    parent = item._parent;
					while (/^(Group|CompoundPath)$/.test(parent._class)) {
						item = parent;
						parent = parent._parent;
					}
					this._item = item;
				}
			}
			return this._item;
		},

		setItem: function (item) {
			this._item = item;
		},

		toString: function () {
			return '{ type: ' + this.type + ', point: ' + this.getPoint() + ', count: ' + this.getCount() + ', modifiers: ' + this.getModifiers() + ' }';
		}
	});

	var Tool = PaperScopeItem.extend({
		_class: 'Tool',
		_list: 'tools',
		_reference: 'tool',
		_events: ['onMouseDown', 'onMouseUp', 'onMouseDrag', 'onMouseMove', 'onActivate', 'onDeactivate', 'onEditOptions', 'onKeyDown', 'onKeyUp'],

		initialize: function Tool(props) {
			PaperScopeItem.call(this);
			this._moveCount = -1;
			this._downCount = -1;
			this.set(props);
		},

		getMinDistance: function () {
			return this._minDistance;
		},

		setMinDistance: function (minDistance) {
			this._minDistance = minDistance;
			if (minDistance != null && this._maxDistance != null && minDistance > this._maxDistance) {
				this._maxDistance = minDistance;
			}
		},

		getMaxDistance: function () {
			return this._maxDistance;
		},

		setMaxDistance: function (maxDistance) {
			this._maxDistance = maxDistance;
			if (this._minDistance != null && maxDistance != null && maxDistance < this._minDistance) {
				this._minDistance = maxDistance;
			}
		},

		getFixedDistance: function () {
			return this._minDistance == this._maxDistance ? this._minDistance : null;
		},

		setFixedDistance: function (distance) {
			this._minDistance = this._maxDistance = distance;
		},

		_handleMouseEvent: function (type, event, point, mouse) {
			paper = this._scope;
			if (mouse.drag && !this.responds(type)) type = 'mousemove';
			var move = mouse.move || mouse.drag,
			    responds = this.responds(type),
			    minDistance = this.minDistance,
			    maxDistance = this.maxDistance,
			    called = false,
			    tool = this;
			function update(minDistance, maxDistance) {
				var pt = point,
				    toolPoint = move ? tool._point : tool._downPoint || pt;
				if (move) {
					if (tool._moveCount && pt.equals(toolPoint)) {
						return false;
					}
					if (toolPoint && (minDistance != null || maxDistance != null)) {
						var vector = pt.subtract(toolPoint),
						    distance = vector.getLength();
						if (distance < (minDistance || 0)) return false;
						if (maxDistance) {
							pt = toolPoint.add(vector.normalize(Math.min(distance, maxDistance)));
						}
					}
					tool._moveCount++;
				}
				tool._point = pt;
				tool._lastPoint = toolPoint || pt;
				if (mouse.down) {
					tool._moveCount = -1;
					tool._downPoint = pt;
					tool._downCount++;
				}
				return true;
			}

			function emit() {
				if (responds) {
					called = tool.emit(type, new ToolEvent(tool, type, event)) || called;
				}
			}

			if (mouse.down) {
				update();
				emit();
			} else if (mouse.up) {
				update(null, maxDistance);
				emit();
			} else if (responds) {
				while (update(minDistance, maxDistance)) emit();
			}
			return called;
		}

	});

	var Http = {
		request: function (options) {
			var xhr = new self.XMLHttpRequest();
			xhr.open((options.method || 'get').toUpperCase(), options.url, Base.pick(options.async, true));
			if (options.mimeType) xhr.overrideMimeType(options.mimeType);
			xhr.onload = function () {
				var status = xhr.status;
				if (status === 0 || status === 200) {
					if (options.onLoad) {
						options.onLoad.call(xhr, xhr.responseText);
					}
				} else {
					xhr.onerror();
				}
			};
			xhr.onerror = function () {
				var status = xhr.status,
				    message = 'Could not load "' + options.url + '" (Status: ' + status + ')';
				if (options.onError) {
					options.onError(message, status);
				} else {
					throw new Error(message);
				}
			};
			return xhr.send(null);
		}
	};

	var CanvasProvider = {
		canvases: [],

		getCanvas: function (width, height) {
			if (!window) return null;
			var canvas,
			    clear = true;
			if (typeof width === 'object') {
				height = width.height;
				width = width.width;
			}
			if (this.canvases.length) {
				canvas = this.canvases.pop();
			} else {
				canvas = document.createElement('canvas');
				clear = false;
			}
			var ctx = canvas.getContext('2d');
			if (!ctx) {
				throw new Error('Canvas ' + canvas + ' is unable to provide a 2D context.');
			}
			if (canvas.width === width && canvas.height === height) {
				if (clear) ctx.clearRect(0, 0, width + 1, height + 1);
			} else {
				canvas.width = width;
				canvas.height = height;
			}
			ctx.save();
			return canvas;
		},

		getContext: function (width, height) {
			var canvas = this.getCanvas(width, height);
			return canvas ? canvas.getContext('2d') : null;
		},

		release: function (obj) {
			var canvas = obj && obj.canvas ? obj.canvas : obj;
			if (canvas && canvas.getContext) {
				canvas.getContext('2d').restore();
				this.canvases.push(canvas);
			}
		}
	};

	var BlendMode = new function () {
		var min = Math.min,
		    max = Math.max,
		    abs = Math.abs,
		    sr,
		    sg,
		    sb,
		    sa,
		    br,
		    bg,
		    bb,
		    ba,
		    dr,
		    dg,
		    db;

		function getLum(r, g, b) {
			return 0.2989 * r + 0.587 * g + 0.114 * b;
		}

		function setLum(r, g, b, l) {
			var d = l - getLum(r, g, b);
			dr = r + d;
			dg = g + d;
			db = b + d;
			var l = getLum(dr, dg, db),
			    mn = min(dr, dg, db),
			    mx = max(dr, dg, db);
			if (mn < 0) {
				var lmn = l - mn;
				dr = l + (dr - l) * l / lmn;
				dg = l + (dg - l) * l / lmn;
				db = l + (db - l) * l / lmn;
			}
			if (mx > 255) {
				var ln = 255 - l,
				    mxl = mx - l;
				dr = l + (dr - l) * ln / mxl;
				dg = l + (dg - l) * ln / mxl;
				db = l + (db - l) * ln / mxl;
			}
		}

		function getSat(r, g, b) {
			return max(r, g, b) - min(r, g, b);
		}

		function setSat(r, g, b, s) {
			var col = [r, g, b],
			    mx = max(r, g, b),
			    mn = min(r, g, b),
			    md;
			mn = mn === r ? 0 : mn === g ? 1 : 2;
			mx = mx === r ? 0 : mx === g ? 1 : 2;
			md = min(mn, mx) === 0 ? max(mn, mx) === 1 ? 2 : 1 : 0;
			if (col[mx] > col[mn]) {
				col[md] = (col[md] - col[mn]) * s / (col[mx] - col[mn]);
				col[mx] = s;
			} else {
				col[md] = col[mx] = 0;
			}
			col[mn] = 0;
			dr = col[0];
			dg = col[1];
			db = col[2];
		}

		var modes = {
			multiply: function () {
				dr = br * sr / 255;
				dg = bg * sg / 255;
				db = bb * sb / 255;
			},

			screen: function () {
				dr = br + sr - br * sr / 255;
				dg = bg + sg - bg * sg / 255;
				db = bb + sb - bb * sb / 255;
			},

			overlay: function () {
				dr = br < 128 ? 2 * br * sr / 255 : 255 - 2 * (255 - br) * (255 - sr) / 255;
				dg = bg < 128 ? 2 * bg * sg / 255 : 255 - 2 * (255 - bg) * (255 - sg) / 255;
				db = bb < 128 ? 2 * bb * sb / 255 : 255 - 2 * (255 - bb) * (255 - sb) / 255;
			},

			'soft-light': function () {
				var t = sr * br / 255;
				dr = t + br * (255 - (255 - br) * (255 - sr) / 255 - t) / 255;
				t = sg * bg / 255;
				dg = t + bg * (255 - (255 - bg) * (255 - sg) / 255 - t) / 255;
				t = sb * bb / 255;
				db = t + bb * (255 - (255 - bb) * (255 - sb) / 255 - t) / 255;
			},

			'hard-light': function () {
				dr = sr < 128 ? 2 * sr * br / 255 : 255 - 2 * (255 - sr) * (255 - br) / 255;
				dg = sg < 128 ? 2 * sg * bg / 255 : 255 - 2 * (255 - sg) * (255 - bg) / 255;
				db = sb < 128 ? 2 * sb * bb / 255 : 255 - 2 * (255 - sb) * (255 - bb) / 255;
			},

			'color-dodge': function () {
				dr = br === 0 ? 0 : sr === 255 ? 255 : min(255, 255 * br / (255 - sr));
				dg = bg === 0 ? 0 : sg === 255 ? 255 : min(255, 255 * bg / (255 - sg));
				db = bb === 0 ? 0 : sb === 255 ? 255 : min(255, 255 * bb / (255 - sb));
			},

			'color-burn': function () {
				dr = br === 255 ? 255 : sr === 0 ? 0 : max(0, 255 - (255 - br) * 255 / sr);
				dg = bg === 255 ? 255 : sg === 0 ? 0 : max(0, 255 - (255 - bg) * 255 / sg);
				db = bb === 255 ? 255 : sb === 0 ? 0 : max(0, 255 - (255 - bb) * 255 / sb);
			},

			darken: function () {
				dr = br < sr ? br : sr;
				dg = bg < sg ? bg : sg;
				db = bb < sb ? bb : sb;
			},

			lighten: function () {
				dr = br > sr ? br : sr;
				dg = bg > sg ? bg : sg;
				db = bb > sb ? bb : sb;
			},

			difference: function () {
				dr = br - sr;
				if (dr < 0) dr = -dr;
				dg = bg - sg;
				if (dg < 0) dg = -dg;
				db = bb - sb;
				if (db < 0) db = -db;
			},

			exclusion: function () {
				dr = br + sr * (255 - br - br) / 255;
				dg = bg + sg * (255 - bg - bg) / 255;
				db = bb + sb * (255 - bb - bb) / 255;
			},

			hue: function () {
				setSat(sr, sg, sb, getSat(br, bg, bb));
				setLum(dr, dg, db, getLum(br, bg, bb));
			},

			saturation: function () {
				setSat(br, bg, bb, getSat(sr, sg, sb));
				setLum(dr, dg, db, getLum(br, bg, bb));
			},

			luminosity: function () {
				setLum(br, bg, bb, getLum(sr, sg, sb));
			},

			color: function () {
				setLum(sr, sg, sb, getLum(br, bg, bb));
			},

			add: function () {
				dr = min(br + sr, 255);
				dg = min(bg + sg, 255);
				db = min(bb + sb, 255);
			},

			subtract: function () {
				dr = max(br - sr, 0);
				dg = max(bg - sg, 0);
				db = max(bb - sb, 0);
			},

			average: function () {
				dr = (br + sr) / 2;
				dg = (bg + sg) / 2;
				db = (bb + sb) / 2;
			},

			negation: function () {
				dr = 255 - abs(255 - sr - br);
				dg = 255 - abs(255 - sg - bg);
				db = 255 - abs(255 - sb - bb);
			}
		};

		var nativeModes = this.nativeModes = Base.each(['source-over', 'source-in', 'source-out', 'source-atop', 'destination-over', 'destination-in', 'destination-out', 'destination-atop', 'lighter', 'darker', 'copy', 'xor'], function (mode) {
			this[mode] = true;
		}, {});

		var ctx = CanvasProvider.getContext(1, 1);
		if (ctx) {
			Base.each(modes, function (func, mode) {
				var darken = mode === 'darken',
				    ok = false;
				ctx.save();
				try {
					ctx.fillStyle = darken ? '#300' : '#a00';
					ctx.fillRect(0, 0, 1, 1);
					ctx.globalCompositeOperation = mode;
					if (ctx.globalCompositeOperation === mode) {
						ctx.fillStyle = darken ? '#a00' : '#300';
						ctx.fillRect(0, 0, 1, 1);
						ok = ctx.getImageData(0, 0, 1, 1).data[0] !== darken ? 170 : 51;
					}
				} catch (e) {}
				ctx.restore();
				nativeModes[mode] = ok;
			});
			CanvasProvider.release(ctx);
		}

		this.process = function (mode, srcContext, dstContext, alpha, offset) {
			var srcCanvas = srcContext.canvas,
			    normal = mode === 'normal';
			if (normal || nativeModes[mode]) {
				dstContext.save();
				dstContext.setTransform(1, 0, 0, 1, 0, 0);
				dstContext.globalAlpha = alpha;
				if (!normal) dstContext.globalCompositeOperation = mode;
				dstContext.drawImage(srcCanvas, offset.x, offset.y);
				dstContext.restore();
			} else {
				var process = modes[mode];
				if (!process) return;
				var dstData = dstContext.getImageData(offset.x, offset.y, srcCanvas.width, srcCanvas.height),
				    dst = dstData.data,
				    src = srcContext.getImageData(0, 0, srcCanvas.width, srcCanvas.height).data;
				for (var i = 0, l = dst.length; i < l; i += 4) {
					sr = src[i];
					br = dst[i];
					sg = src[i + 1];
					bg = dst[i + 1];
					sb = src[i + 2];
					bb = dst[i + 2];
					sa = src[i + 3];
					ba = dst[i + 3];
					process();
					var a1 = sa * alpha / 255,
					    a2 = 1 - a1;
					dst[i] = a1 * dr + a2 * br;
					dst[i + 1] = a1 * dg + a2 * bg;
					dst[i + 2] = a1 * db + a2 * bb;
					dst[i + 3] = sa * alpha + a2 * ba;
				}
				dstContext.putImageData(dstData, offset.x, offset.y);
			}
		};
	}();

	var SvgElement = new function () {
		var svg = 'http://www.w3.org/2000/svg',
		    xmlns = 'http://www.w3.org/2000/xmlns',
		    xlink = 'http://www.w3.org/1999/xlink',
		    attributeNamespace = {
			href: xlink,
			xlink: xmlns,
			xmlns: xmlns + '/',
			'xmlns:xlink': xmlns + '/'
		};

		function create(tag, attributes, formatter) {
			return set(document.createElementNS(svg, tag), attributes, formatter);
		}

		function get(node, name) {
			var namespace = attributeNamespace[name],
			    value = namespace ? node.getAttributeNS(namespace, name) : node.getAttribute(name);
			return value === 'null' ? null : value;
		}

		function set(node, attributes, formatter) {
			for (var name in attributes) {
				var value = attributes[name],
				    namespace = attributeNamespace[name];
				if (typeof value === 'number' && formatter) value = formatter.number(value);
				if (namespace) {
					node.setAttributeNS(namespace, name, value);
				} else {
					node.setAttribute(name, value);
				}
			}
			return node;
		}

		return {
			svg: svg,
			xmlns: xmlns,
			xlink: xlink,

			create: create,
			get: get,
			set: set
		};
	}();

	var SvgStyles = Base.each({
		fillColor: ['fill', 'color'],
		fillRule: ['fill-rule', 'string'],
		strokeColor: ['stroke', 'color'],
		strokeWidth: ['stroke-width', 'number'],
		strokeCap: ['stroke-linecap', 'string'],
		strokeJoin: ['stroke-linejoin', 'string'],
		strokeScaling: ['vector-effect', 'lookup', {
			true: 'none',
			false: 'non-scaling-stroke'
		}, function (item, value) {
			return !value && (item instanceof PathItem || item instanceof Shape || item instanceof TextItem);
		}],
		miterLimit: ['stroke-miterlimit', 'number'],
		dashArray: ['stroke-dasharray', 'array'],
		dashOffset: ['stroke-dashoffset', 'number'],
		fontFamily: ['font-family', 'string'],
		fontWeight: ['font-weight', 'string'],
		fontSize: ['font-size', 'number'],
		justification: ['text-anchor', 'lookup', {
			left: 'start',
			center: 'middle',
			right: 'end'
		}],
		opacity: ['opacity', 'number'],
		blendMode: ['mix-blend-mode', 'style']
	}, function (entry, key) {
		var part = Base.capitalize(key),
		    lookup = entry[2];
		this[key] = {
			type: entry[1],
			property: key,
			attribute: entry[0],
			toSVG: lookup,
			fromSVG: lookup && Base.each(lookup, function (value, name) {
				this[value] = name;
			}, {}),
			exportFilter: entry[3],
			get: 'get' + part,
			set: 'set' + part
		};
	}, {});

	new function () {
		var formatter;

		function getTransform(matrix, coordinates, center) {
			var attrs = new Base(),
			    trans = matrix.getTranslation();
			if (coordinates) {
				matrix = matrix._shiftless();
				var point = matrix._inverseTransform(trans);
				attrs[center ? 'cx' : 'x'] = point.x;
				attrs[center ? 'cy' : 'y'] = point.y;
				trans = null;
			}
			if (!matrix.isIdentity()) {
				var decomposed = matrix.decompose();
				if (decomposed) {
					var parts = [],
					    angle = decomposed.rotation,
					    scale = decomposed.scaling,
					    skew = decomposed.skewing;
					if (trans && !trans.isZero()) parts.push('translate(' + formatter.point(trans) + ')');
					if (angle) parts.push('rotate(' + formatter.number(angle) + ')');
					if (!Numerical.isZero(scale.x - 1) || !Numerical.isZero(scale.y - 1)) parts.push('scale(' + formatter.point(scale) + ')');
					if (skew && skew.x) parts.push('skewX(' + formatter.number(skew.x) + ')');
					if (skew && skew.y) parts.push('skewY(' + formatter.number(skew.y) + ')');
					attrs.transform = parts.join(' ');
				} else {
					attrs.transform = 'matrix(' + matrix.getValues().join(',') + ')';
				}
			}
			return attrs;
		}

		function exportGroup(item, options) {
			var attrs = getTransform(item._matrix),
			    children = item._children;
			var node = SvgElement.create('g', attrs, formatter);
			for (var i = 0, l = children.length; i < l; i++) {
				var child = children[i];
				var childNode = exportSVG(child, options);
				if (childNode) {
					if (child.isClipMask()) {
						var clip = SvgElement.create('clipPath');
						clip.appendChild(childNode);
						setDefinition(child, clip, 'clip');
						SvgElement.set(node, {
							'clip-path': 'url(#' + clip.id + ')'
						});
					} else {
						node.appendChild(childNode);
					}
				}
			}
			return node;
		}

		function exportRaster(item, options) {
			var attrs = getTransform(item._matrix, true),
			    size = item.getSize(),
			    image = item.getImage();
			attrs.x -= size.width / 2;
			attrs.y -= size.height / 2;
			attrs.width = size.width;
			attrs.height = size.height;
			attrs.href = options.embedImages === false && image && image.src || item.toDataURL();
			return SvgElement.create('image', attrs, formatter);
		}

		function exportPath(item, options) {
			var matchShapes = options.matchShapes;
			if (matchShapes) {
				var shape = item.toShape(false);
				if (shape) return exportShape(shape, options);
			}
			var segments = item._segments,
			    length = segments.length,
			    type,
			    attrs = getTransform(item._matrix);
			if (matchShapes && length >= 2 && !item.hasHandles()) {
				if (length > 2) {
					type = item._closed ? 'polygon' : 'polyline';
					var parts = [];
					for (var i = 0; i < length; i++) parts.push(formatter.point(segments[i]._point));
					attrs.points = parts.join(' ');
				} else {
					type = 'line';
					var start = segments[0]._point,
					    end = segments[1]._point;
					attrs.set({
						x1: start.x,
						y1: start.y,
						x2: end.x,
						y2: end.y
					});
				}
			} else {
				type = 'path';
				attrs.d = item.getPathData(null, options.precision);
			}
			return SvgElement.create(type, attrs, formatter);
		}

		function exportShape(item) {
			var type = item._type,
			    radius = item._radius,
			    attrs = getTransform(item._matrix, true, type !== 'rectangle');
			if (type === 'rectangle') {
				type = 'rect';
				var size = item._size,
				    width = size.width,
				    height = size.height;
				attrs.x -= width / 2;
				attrs.y -= height / 2;
				attrs.width = width;
				attrs.height = height;
				if (radius.isZero()) radius = null;
			}
			if (radius) {
				if (type === 'circle') {
					attrs.r = radius;
				} else {
					attrs.rx = radius.width;
					attrs.ry = radius.height;
				}
			}
			return SvgElement.create(type, attrs, formatter);
		}

		function exportCompoundPath(item, options) {
			var attrs = getTransform(item._matrix);
			var data = item.getPathData(null, options.precision);
			if (data) attrs.d = data;
			return SvgElement.create('path', attrs, formatter);
		}

		function exportSymbolItem(item, options) {
			var attrs = getTransform(item._matrix, true),
			    definition = item._definition,
			    node = getDefinition(definition, 'symbol'),
			    definitionItem = definition._item,
			    bounds = definitionItem.getBounds();
			if (!node) {
				node = SvgElement.create('symbol', {
					viewBox: formatter.rectangle(bounds)
				});
				node.appendChild(exportSVG(definitionItem, options));
				setDefinition(definition, node, 'symbol');
			}
			attrs.href = '#' + node.id;
			attrs.x += bounds.x;
			attrs.y += bounds.y;
			attrs.width = bounds.width;
			attrs.height = bounds.height;
			attrs.overflow = 'visible';
			return SvgElement.create('use', attrs, formatter);
		}

		function exportGradient(color) {
			var gradientNode = getDefinition(color, 'color');
			if (!gradientNode) {
				var gradient = color.getGradient(),
				    radial = gradient._radial,
				    origin = color.getOrigin(),
				    destination = color.getDestination(),
				    attrs;
				if (radial) {
					attrs = {
						cx: origin.x,
						cy: origin.y,
						r: origin.getDistance(destination)
					};
					var highlight = color.getHighlight();
					if (highlight) {
						attrs.fx = highlight.x;
						attrs.fy = highlight.y;
					}
				} else {
					attrs = {
						x1: origin.x,
						y1: origin.y,
						x2: destination.x,
						y2: destination.y
					};
				}
				attrs.gradientUnits = 'userSpaceOnUse';
				gradientNode = SvgElement.create((radial ? 'radial' : 'linear') + 'Gradient', attrs, formatter);
				var stops = gradient._stops;
				for (var i = 0, l = stops.length; i < l; i++) {
					var stop = stops[i],
					    stopColor = stop._color,
					    alpha = stopColor.getAlpha(),
					    offset = stop._offset;
					attrs = {
						offset: offset == null ? i / (l - 1) : offset
					};
					if (stopColor) attrs['stop-color'] = stopColor.toCSS(true);
					if (alpha < 1) attrs['stop-opacity'] = alpha;
					gradientNode.appendChild(SvgElement.create('stop', attrs, formatter));
				}
				setDefinition(color, gradientNode, 'color');
			}
			return 'url(#' + gradientNode.id + ')';
		}

		function exportText(item) {
			var node = SvgElement.create('text', getTransform(item._matrix, true), formatter);
			node.textContent = item._content;
			return node;
		}

		var exporters = {
			Group: exportGroup,
			Layer: exportGroup,
			Raster: exportRaster,
			Path: exportPath,
			Shape: exportShape,
			CompoundPath: exportCompoundPath,
			SymbolItem: exportSymbolItem,
			PointText: exportText
		};

		function applyStyle(item, node, isRoot) {
			var attrs = {},
			    parent = !isRoot && item.getParent(),
			    style = [];

			if (item._name != null) attrs.id = item._name;

			Base.each(SvgStyles, function (entry) {
				var get = entry.get,
				    type = entry.type,
				    value = item[get]();
				if (entry.exportFilter ? entry.exportFilter(item, value) : !parent || !Base.equals(parent[get](), value)) {
					if (type === 'color' && value != null) {
						var alpha = value.getAlpha();
						if (alpha < 1) attrs[entry.attribute + '-opacity'] = alpha;
					}
					if (type === 'style') {
						style.push(entry.attribute + ': ' + value);
					} else {
						attrs[entry.attribute] = value == null ? 'none' : type === 'color' ? value.gradient ? exportGradient(value, item) : value.toCSS(true) : type === 'array' ? value.join(',') : type === 'lookup' ? entry.toSVG[value] : value;
					}
				}
			});

			if (style.length) attrs.style = style.join(';');

			if (attrs.opacity === 1) delete attrs.opacity;

			if (!item._visible) attrs.visibility = 'hidden';

			return SvgElement.set(node, attrs, formatter);
		}

		var definitions;
		function getDefinition(item, type) {
			if (!definitions) definitions = { ids: {}, svgs: {} };
			return item && definitions.svgs[type + '-' + (item._id || item.__id || (item.__id = UID.get('svg')))];
		}

		function setDefinition(item, node, type) {
			if (!definitions) getDefinition();
			var typeId = definitions.ids[type] = (definitions.ids[type] || 0) + 1;
			node.id = type + '-' + typeId;
			definitions.svgs[type + '-' + (item._id || item.__id)] = node;
		}

		function exportDefinitions(node, options) {
			var svg = node,
			    defs = null;
			if (definitions) {
				svg = node.nodeName.toLowerCase() === 'svg' && node;
				for (var i in definitions.svgs) {
					if (!defs) {
						if (!svg) {
							svg = SvgElement.create('svg');
							svg.appendChild(node);
						}
						defs = svg.insertBefore(SvgElement.create('defs'), svg.firstChild);
					}
					defs.appendChild(definitions.svgs[i]);
				}
				definitions = null;
			}
			return options.asString ? new self.XMLSerializer().serializeToString(svg) : svg;
		}

		function exportSVG(item, options, isRoot) {
			var exporter = exporters[item._class],
			    node = exporter && exporter(item, options);
			if (node) {
				var onExport = options.onExport;
				if (onExport) node = onExport(item, node, options) || node;
				var data = JSON.stringify(item._data);
				if (data && data !== '{}' && data !== 'null') node.setAttribute('data-paper-data', data);
			}
			return node && applyStyle(item, node, isRoot);
		}

		function setOptions(options) {
			if (!options) options = {};
			formatter = new Formatter(options.precision);
			return options;
		}

		Item.inject({
			exportSVG: function (options) {
				options = setOptions(options);
				return exportDefinitions(exportSVG(this, options, true), options);
			}
		});

		Project.inject({
			exportSVG: function (options) {
				options = setOptions(options);
				var children = this._children,
				    view = this.getView(),
				    bounds = Base.pick(options.bounds, 'view'),
				    mx = options.matrix || bounds === 'view' && view._matrix,
				    matrix = mx && Matrix.read([mx]),
				    rect = bounds === 'view' ? new Rectangle([0, 0], view.getViewSize()) : bounds === 'content' ? Item._getBounds(children, matrix, { stroke: true }) : Rectangle.read([bounds], 0, { readNull: true }),
				    attrs = {
					version: '1.1',
					xmlns: SvgElement.svg,
					'xmlns:xlink': SvgElement.xlink
				};
				if (rect) {
					attrs.width = rect.width;
					attrs.height = rect.height;
					if (rect.x || rect.y) attrs.viewBox = formatter.rectangle(rect);
				}
				var node = SvgElement.create('svg', attrs, formatter),
				    parent = node;
				if (matrix && !matrix.isIdentity()) {
					parent = node.appendChild(SvgElement.create('g', getTransform(matrix), formatter));
				}
				for (var i = 0, l = children.length; i < l; i++) {
					parent.appendChild(exportSVG(children[i], options, true));
				}
				return exportDefinitions(node, options);
			}
		});
	}();

	new function () {

		var definitions = {},
		    rootSize;

		function getValue(node, name, isString, allowNull, allowPercent) {
			var value = SvgElement.get(node, name),
			    res = value == null ? allowNull ? null : isString ? '' : 0 : isString ? value : parseFloat(value);
			return (/%\s*$/.test(value) ? res / 100 * (allowPercent ? 1 : rootSize[/x|^width/.test(name) ? 'width' : 'height']) : res
			);
		}

		function getPoint(node, x, y, allowNull, allowPercent) {
			x = getValue(node, x || 'x', false, allowNull, allowPercent);
			y = getValue(node, y || 'y', false, allowNull, allowPercent);
			return allowNull && (x == null || y == null) ? null : new Point(x, y);
		}

		function getSize(node, w, h, allowNull, allowPercent) {
			w = getValue(node, w || 'width', false, allowNull, allowPercent);
			h = getValue(node, h || 'height', false, allowNull, allowPercent);
			return allowNull && (w == null || h == null) ? null : new Size(w, h);
		}

		function convertValue(value, type, lookup) {
			return value === 'none' ? null : type === 'number' ? parseFloat(value) : type === 'array' ? value ? value.split(/[\s,]+/g).map(parseFloat) : [] : type === 'color' ? getDefinition(value) || value : type === 'lookup' ? lookup[value] : value;
		}

		function importGroup(node, type, options, isRoot) {
			var nodes = node.childNodes,
			    isClip = type === 'clippath',
			    isDefs = type === 'defs',
			    item = new Group(),
			    project = item._project,
			    currentStyle = project._currentStyle,
			    children = [];
			if (!isClip && !isDefs) {
				item = applyAttributes(item, node, isRoot);
				project._currentStyle = item._style.clone();
			}
			if (isRoot) {
				var defs = node.querySelectorAll('defs');
				for (var i = 0, l = defs.length; i < l; i++) {
					importNode(defs[i], options, false);
				}
			}
			for (var i = 0, l = nodes.length; i < l; i++) {
				var childNode = nodes[i],
				    child;
				if (childNode.nodeType === 1 && !/^defs$/i.test(childNode.nodeName) && (child = importNode(childNode, options, false)) && !(child instanceof SymbolDefinition)) children.push(child);
			}
			item.addChildren(children);
			if (isClip) item = applyAttributes(item.reduce(), node, isRoot);
			project._currentStyle = currentStyle;
			if (isClip || isDefs) {
				item.remove();
				item = null;
			}
			return item;
		}

		function importPoly(node, type) {
			var coords = node.getAttribute('points').match(/[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/g),
			    points = [];
			for (var i = 0, l = coords.length; i < l; i += 2) points.push(new Point(parseFloat(coords[i]), parseFloat(coords[i + 1])));
			var path = new Path(points);
			if (type === 'polygon') path.closePath();
			return path;
		}

		function importPath(node) {
			return PathItem.create(node.getAttribute('d'));
		}

		function importGradient(node, type) {
			var id = (getValue(node, 'href', true) || '').substring(1),
			    radial = type === 'radialgradient',
			    gradient;
			if (id) {
				gradient = definitions[id].getGradient();
				if (gradient._radial ^ radial) {
					gradient = gradient.clone();
					gradient._radial = radial;
				}
			} else {
				var nodes = node.childNodes,
				    stops = [];
				for (var i = 0, l = nodes.length; i < l; i++) {
					var child = nodes[i];
					if (child.nodeType === 1) stops.push(applyAttributes(new GradientStop(), child));
				}
				gradient = new Gradient(stops, radial);
			}
			var origin,
			    destination,
			    highlight,
			    scaleToBounds = getValue(node, 'gradientUnits', true) !== 'userSpaceOnUse';
			if (radial) {
				origin = getPoint(node, 'cx', 'cy', false, scaleToBounds);
				destination = origin.add(getValue(node, 'r', false, false, scaleToBounds), 0);
				highlight = getPoint(node, 'fx', 'fy', true, scaleToBounds);
			} else {
				origin = getPoint(node, 'x1', 'y1', false, scaleToBounds);
				destination = getPoint(node, 'x2', 'y2', false, scaleToBounds);
			}
			var color = applyAttributes(new Color(gradient, origin, destination, highlight), node);
			color._scaleToBounds = scaleToBounds;
			return null;
		}

		var importers = {
			'#document': function (node, type, options, isRoot) {
				var nodes = node.childNodes;
				for (var i = 0, l = nodes.length; i < l; i++) {
					var child = nodes[i];
					if (child.nodeType === 1) return importNode(child, options, isRoot);
				}
			},
			g: importGroup,
			svg: importGroup,
			clippath: importGroup,
			polygon: importPoly,
			polyline: importPoly,
			path: importPath,
			lineargradient: importGradient,
			radialgradient: importGradient,

			image: function (node) {
				var raster = new Raster(getValue(node, 'href', true));
				raster.on('load', function () {
					var size = getSize(node);
					this.setSize(size);
					var center = this._matrix._transformPoint(getPoint(node).add(size.divide(2)));
					this.translate(center);
				});
				return raster;
			},

			symbol: function (node, type, options, isRoot) {
				return new SymbolDefinition(importGroup(node, type, options, isRoot), true);
			},

			defs: importGroup,

			use: function (node) {
				var id = (getValue(node, 'href', true) || '').substring(1),
				    definition = definitions[id],
				    point = getPoint(node);
				return definition ? definition instanceof SymbolDefinition ? definition.place(point) : definition.clone().translate(point) : null;
			},

			circle: function (node) {
				return new Shape.Circle(getPoint(node, 'cx', 'cy'), getValue(node, 'r'));
			},

			ellipse: function (node) {
				return new Shape.Ellipse({
					center: getPoint(node, 'cx', 'cy'),
					radius: getSize(node, 'rx', 'ry')
				});
			},

			rect: function (node) {
				return new Shape.Rectangle(new Rectangle(getPoint(node), getSize(node)), getSize(node, 'rx', 'ry'));
			},

			line: function (node) {
				return new Path.Line(getPoint(node, 'x1', 'y1'), getPoint(node, 'x2', 'y2'));
			},

			text: function (node) {
				var text = new PointText(getPoint(node).add(getPoint(node, 'dx', 'dy')));
				text.setContent(node.textContent.trim() || '');
				return text;
			}
		};

		function applyTransform(item, value, name, node) {
			if (item.transform) {
				var transforms = (node.getAttribute(name) || '').split(/\)\s*/g),
				    matrix = new Matrix();
				for (var i = 0, l = transforms.length; i < l; i++) {
					var transform = transforms[i];
					if (!transform) break;
					var parts = transform.split(/\(\s*/),
					    command = parts[0],
					    v = parts[1].split(/[\s,]+/g);
					for (var j = 0, m = v.length; j < m; j++) v[j] = parseFloat(v[j]);
					switch (command) {
						case 'matrix':
							matrix.append(new Matrix(v[0], v[1], v[2], v[3], v[4], v[5]));
							break;
						case 'rotate':
							matrix.rotate(v[0], v[1], v[2]);
							break;
						case 'translate':
							matrix.translate(v[0], v[1]);
							break;
						case 'scale':
							matrix.scale(v);
							break;
						case 'skewX':
							matrix.skew(v[0], 0);
							break;
						case 'skewY':
							matrix.skew(0, v[0]);
							break;
					}
				}
				item.transform(matrix);
			}
		}

		function applyOpacity(item, value, name) {
			var key = name === 'fill-opacity' ? 'getFillColor' : 'getStrokeColor',
			    color = item[key] && item[key]();
			if (color) color.setAlpha(parseFloat(value));
		}

		var attributes = Base.set(Base.each(SvgStyles, function (entry) {
			this[entry.attribute] = function (item, value) {
				if (item[entry.set]) {
					item[entry.set](convertValue(value, entry.type, entry.fromSVG));
					if (entry.type === 'color') {
						var color = item[entry.get]();
						if (color) {
							if (color._scaleToBounds) {
								var bounds = item.getBounds();
								color.transform(new Matrix().translate(bounds.getPoint()).scale(bounds.getSize()));
							}
							if (item instanceof Shape) {
								color.transform(new Matrix().translate(item.getPosition(true).negate()));
							}
						}
					}
				}
			};
		}, {}), {
			id: function (item, value) {
				definitions[value] = item;
				if (item.setName) item.setName(value);
			},

			'clip-path': function (item, value) {
				var clip = getDefinition(value);
				if (clip) {
					clip = clip.clone();
					clip.setClipMask(true);
					if (item instanceof Group) {
						item.insertChild(0, clip);
					} else {
						return new Group(clip, item);
					}
				}
			},

			gradientTransform: applyTransform,
			transform: applyTransform,

			'fill-opacity': applyOpacity,
			'stroke-opacity': applyOpacity,

			visibility: function (item, value) {
				if (item.setVisible) item.setVisible(value === 'visible');
			},

			display: function (item, value) {
				if (item.setVisible) item.setVisible(value !== null);
			},

			'stop-color': function (item, value) {
				if (item.setColor) item.setColor(value);
			},

			'stop-opacity': function (item, value) {
				if (item._color) item._color.setAlpha(parseFloat(value));
			},

			offset: function (item, value) {
				if (item.setOffset) {
					var percent = value.match(/(.*)%$/);
					item.setOffset(percent ? percent[1] / 100 : parseFloat(value));
				}
			},

			viewBox: function (item, value, name, node, styles) {
				var rect = new Rectangle(convertValue(value, 'array')),
				    size = getSize(node, null, null, true),
				    group,
				    matrix;
				if (item instanceof Group) {
					var scale = size ? size.divide(rect.getSize()) : 1,
					    matrix = new Matrix().scale(scale).translate(rect.getPoint().negate());
					group = item;
				} else if (item instanceof SymbolDefinition) {
					if (size) rect.setSize(size);
					group = item._item;
				}
				if (group) {
					if (getAttribute(node, 'overflow', styles) !== 'visible') {
						var clip = new Shape.Rectangle(rect);
						clip.setClipMask(true);
						group.addChild(clip);
					}
					if (matrix) group.transform(matrix);
				}
			}
		});

		function getAttribute(node, name, styles) {
			var attr = node.attributes[name],
			    value = attr && attr.value;
			if (!value) {
				var style = Base.camelize(name);
				value = node.style[style];
				if (!value && styles.node[style] !== styles.parent[style]) value = styles.node[style];
			}
			return !value ? undefined : value === 'none' ? null : value;
		}

		function applyAttributes(item, node, isRoot) {
			var parent = node.parentNode,
			    styles = {
				node: DomElement.getStyles(node) || {},
				parent: !isRoot && !/^defs$/i.test(parent.tagName) && DomElement.getStyles(parent) || {}
			};
			Base.each(attributes, function (apply, name) {
				var value = getAttribute(node, name, styles);
				item = value !== undefined && apply(item, value, name, node, styles) || item;
			});
			return item;
		}

		function getDefinition(value) {
			var match = value && value.match(/\((?:["'#]*)([^"')]+)/),
			    name = match && match[1],
			    res = name && definitions[window ? name.replace(window.location.href.split('#')[0] + '#', '') : name];
			if (res && res._scaleToBounds) {
				res = res.clone();
				res._scaleToBounds = true;
			}
			return res;
		}

		function importNode(node, options, isRoot) {
			var type = node.nodeName.toLowerCase(),
			    isElement = type !== '#document',
			    body = document.body,
			    container,
			    parent,
			    next;
			if (isRoot && isElement) {
				rootSize = getSize(node, null, null, true) || paper.getView().getSize();
				container = SvgElement.create('svg', {
					style: 'stroke-width: 1px; stroke-miterlimit: 10'
				});
				parent = node.parentNode;
				next = node.nextSibling;
				container.appendChild(node);
				body.appendChild(container);
			}
			var settings = paper.settings,
			    applyMatrix = settings.applyMatrix,
			    insertItems = settings.insertItems;
			settings.applyMatrix = false;
			settings.insertItems = false;
			var importer = importers[type],
			    item = importer && importer(node, type, options, isRoot) || null;
			settings.insertItems = insertItems;
			settings.applyMatrix = applyMatrix;
			if (item) {
				if (isElement && !(item instanceof Group)) item = applyAttributes(item, node, isRoot);
				var onImport = options.onImport,
				    data = isElement && node.getAttribute('data-paper-data');
				if (onImport) item = onImport(node, item, options) || item;
				if (options.expandShapes && item instanceof Shape) {
					item.remove();
					item = item.toPath();
				}
				if (data) item._data = JSON.parse(data);
			}
			if (container) {
				body.removeChild(container);
				if (parent) {
					if (next) {
						parent.insertBefore(node, next);
					} else {
						parent.appendChild(node);
					}
				}
			}
			if (isRoot) {
				definitions = {};
				if (item && Base.pick(options.applyMatrix, applyMatrix)) item.matrix.apply(true, true);
			}
			return item;
		}

		function importSVG(source, options, owner) {
			if (!source) return null;
			options = typeof options === 'function' ? { onLoad: options } : options || {};
			var scope = paper,
			    item = null;

			function onLoad(svg) {
				try {
					var node = typeof svg === 'object' ? svg : new self.DOMParser().parseFromString(svg, 'image/svg+xml');
					if (!node.nodeName) {
						node = null;
						throw new Error('Unsupported SVG source: ' + source);
					}
					paper = scope;
					item = importNode(node, options, true);
					if (!options || options.insert !== false) {
						owner._insertItem(undefined, item);
					}
					var onLoad = options.onLoad;
					if (onLoad) onLoad(item, svg);
				} catch (e) {
					onError(e);
				}
			}

			function onError(message, status) {
				var onError = options.onError;
				if (onError) {
					onError(message, status);
				} else {
					throw new Error(message);
				}
			}

			if (typeof source === 'string' && !/^.*</.test(source)) {
				var node = document.getElementById(source);
				if (node) {
					onLoad(node);
				} else {
					Http.request({
						url: source,
						async: true,
						onLoad: onLoad,
						onError: onError
					});
				}
			} else if (typeof File !== 'undefined' && source instanceof File) {
				var reader = new FileReader();
				reader.onload = function () {
					onLoad(reader.result);
				};
				reader.onerror = function () {
					onError(reader.error);
				};
				return reader.readAsText(source);
			} else {
				onLoad(source);
			}

			return item;
		}

		Item.inject({
			importSVG: function (node, options) {
				return importSVG(node, options, this);
			}
		});

		Project.inject({
			importSVG: function (node, options) {
				this.activate();
				return importSVG(node, options, this);
			}
		});
	}();

	Base.exports.PaperScript = function () {
		var exports,
		    define,
		    scope = this;
		!function (e, r) {
			return "object" == typeof exports && "object" == typeof module ? r(exports) : "function" == typeof define && define.amd ? define(["exports"], r) : void r(e.acorn || (e.acorn = {}));
		}(this, function (e) {
			"use strict";
			function r(e) {
				fe = e || {};for (var r in he) Object.prototype.hasOwnProperty.call(fe, r) || (fe[r] = he[r]);me = fe.sourceFile || null;
			}function t(e, r) {
				var t = ve(de, e);r += " (" + t.line + ":" + t.column + ")";var n = new SyntaxError(r);throw n.pos = e, n.loc = t, n.raisedAt = be, n;
			}function n(e) {
				function r(e) {
					if (1 == e.length) return t += "return str === " + JSON.stringify(e[0]) + ";";t += "switch(str){";for (var r = 0; r < e.length; ++r) t += "case " + JSON.stringify(e[r]) + ":";t += "return true}return false;";
				}e = e.split(" ");var t = "",
				    n = [];e: for (var a = 0; a < e.length; ++a) {
					for (var o = 0; o < n.length; ++o) if (n[o][0].length == e[a].length) {
						n[o].push(e[a]);continue e;
					}n.push([e[a]]);
				}if (n.length > 3) {
					n.sort(function (e, r) {
						return r.length - e.length;
					}), t += "switch(str.length){";for (var a = 0; a < n.length; ++a) {
						var i = n[a];t += "case " + i[0].length + ":", r(i);
					}t += "}";
				} else r(e);return new Function("str", t);
			}function a() {
				this.line = Ae, this.column = be - Se;
			}function o() {
				Ae = 1, be = Se = 0, Ee = !0, u();
			}function i(e, r) {
				ge = be, fe.locations && (ke = new a()), we = e, u(), Ce = r, Ee = e.beforeExpr;
			}function s() {
				var e = fe.onComment && fe.locations && new a(),
				    r = be,
				    n = de.indexOf("*/", be += 2);if (n === -1 && t(be - 2, "Unterminated comment"), be = n + 2, fe.locations) {
					Kr.lastIndex = r;for (var o; (o = Kr.exec(de)) && o.index < be;) ++Ae, Se = o.index + o[0].length;
				}fe.onComment && fe.onComment(!0, de.slice(r + 2, n), r, be, e, fe.locations && new a());
			}function c() {
				for (var e = be, r = fe.onComment && fe.locations && new a(), t = de.charCodeAt(be += 2); be < pe && 10 !== t && 13 !== t && 8232 !== t && 8233 !== t;) ++be, t = de.charCodeAt(be);fe.onComment && fe.onComment(!1, de.slice(e + 2, be), e, be, r, fe.locations && new a());
			}function u() {
				for (; be < pe;) {
					var e = de.charCodeAt(be);if (32 === e) ++be;else if (13 === e) {
						++be;var r = de.charCodeAt(be);10 === r && ++be, fe.locations && (++Ae, Se = be);
					} else if (10 === e || 8232 === e || 8233 === e) ++be, fe.locations && (++Ae, Se = be);else if (e > 8 && e < 14) ++be;else if (47 === e) {
						var r = de.charCodeAt(be + 1);if (42 === r) s();else {
							if (47 !== r) break;c();
						}
					} else if (160 === e) ++be;else {
						if (!(e >= 5760 && Jr.test(String.fromCharCode(e)))) break;++be;
					}
				}
			}function l() {
				var e = de.charCodeAt(be + 1);return e >= 48 && e <= 57 ? E(!0) : (++be, i(xr));
			}function f() {
				var e = de.charCodeAt(be + 1);return Ee ? (++be, k()) : 61 === e ? x(Er, 2) : x(wr, 1);
			}function d() {
				var e = de.charCodeAt(be + 1);return 61 === e ? x(Er, 2) : x(jr, 1);
			}function p(e) {
				var r = de.charCodeAt(be + 1);return r === e ? x(124 === e ? Ir : Lr, 2) : 61 === r ? x(Er, 2) : x(124 === e ? Ur : Rr, 1);
			}function m() {
				var e = de.charCodeAt(be + 1);return 61 === e ? x(Er, 2) : x(Fr, 1);
			}function h(e) {
				var r = de.charCodeAt(be + 1);return r === e ? 45 == r && 62 == de.charCodeAt(be + 2) && Gr.test(de.slice(Le, be)) ? (be += 3, c(), u(), g()) : x(Ar, 2) : 61 === r ? x(Er, 2) : x(qr, 1);
			}function v(e) {
				var r = de.charCodeAt(be + 1),
				    t = 1;return r === e ? (t = 62 === e && 62 === de.charCodeAt(be + 2) ? 3 : 2, 61 === de.charCodeAt(be + t) ? x(Er, t + 1) : x(Tr, t)) : 33 == r && 60 == e && 45 == de.charCodeAt(be + 2) && 45 == de.charCodeAt(be + 3) ? (be += 4, c(), u(), g()) : (61 === r && (t = 61 === de.charCodeAt(be + 2) ? 3 : 2), x(Vr, t));
			}function b(e) {
				var r = de.charCodeAt(be + 1);return 61 === r ? x(Or, 61 === de.charCodeAt(be + 2) ? 3 : 2) : x(61 === e ? Cr : Sr, 1);
			}function y(e) {
				switch (e) {case 46:
						return l();case 40:
						return ++be, i(hr);case 41:
						return ++be, i(vr);case 59:
						return ++be, i(yr);case 44:
						return ++be, i(br);case 91:
						return ++be, i(fr);case 93:
						return ++be, i(dr);case 123:
						return ++be, i(pr);case 125:
						return ++be, i(mr);case 58:
						return ++be, i(gr);case 63:
						return ++be, i(kr);case 48:
						var r = de.charCodeAt(be + 1);if (120 === r || 88 === r) return C();case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
						return E(!1);case 34:case 39:
						return A(e);case 47:
						return f(e);case 37:case 42:
						return d();case 124:case 38:
						return p(e);case 94:
						return m();case 43:case 45:
						return h(e);case 60:case 62:
						return v(e);case 61:case 33:
						return b(e);case 126:
						return x(Sr, 1);}return !1;
			}function g(e) {
				if (e ? be = ye + 1 : ye = be, fe.locations && (xe = new a()), e) return k();if (be >= pe) return i(Be);var r = de.charCodeAt(be);if (Qr(r) || 92 === r) return L();var n = y(r);if (n === !1) {
					var o = String.fromCharCode(r);if ("\\" === o || $r.test(o)) return L();t(be, "Unexpected character '" + o + "'");
				}return n;
			}function x(e, r) {
				var t = de.slice(be, be + r);be += r, i(e, t);
			}function k() {
				for (var e, r, n = "", a = be;;) {
					be >= pe && t(a, "Unterminated regular expression");var o = de.charAt(be);if (Gr.test(o) && t(a, "Unterminated regular expression"), e) e = !1;else {
						if ("[" === o) r = !0;else if ("]" === o && r) r = !1;else if ("/" === o && !r) break;e = "\\" === o;
					}++be;
				}var n = de.slice(a, be);++be;var s = I();s && !/^[gmsiy]*$/.test(s) && t(a, "Invalid regexp flag");try {
					var c = new RegExp(n, s);
				} catch (u) {
					u instanceof SyntaxError && t(a, u.message), t(u);
				}return i(qe, c);
			}function w(e, r) {
				for (var t = be, n = 0, a = 0, o = null == r ? 1 / 0 : r; a < o; ++a) {
					var i,
					    s = de.charCodeAt(be);if (i = s >= 97 ? s - 97 + 10 : s >= 65 ? s - 65 + 10 : s >= 48 && s <= 57 ? s - 48 : 1 / 0, i >= e) break;++be, n = n * e + i;
				}return be === t || null != r && be - t !== r ? null : n;
			}function C() {
				be += 2;var e = w(16);return null == e && t(ye + 2, "Expected hexadecimal number"), Qr(de.charCodeAt(be)) && t(be, "Identifier directly after number"), i(Te, e);
			}function E(e) {
				var r = be,
				    n = !1,
				    a = 48 === de.charCodeAt(be);e || null !== w(10) || t(r, "Invalid number"), 46 === de.charCodeAt(be) && (++be, w(10), n = !0);var o = de.charCodeAt(be);69 !== o && 101 !== o || (o = de.charCodeAt(++be), 43 !== o && 45 !== o || ++be, null === w(10) && t(r, "Invalid number"), n = !0), Qr(de.charCodeAt(be)) && t(be, "Identifier directly after number");var s,
				    c = de.slice(r, be);return n ? s = parseFloat(c) : a && 1 !== c.length ? /[89]/.test(c) || Oe ? t(r, "Invalid number") : s = parseInt(c, 8) : s = parseInt(c, 10), i(Te, s);
			}function A(e) {
				be++;for (var r = "";;) {
					be >= pe && t(ye, "Unterminated string constant");var n = de.charCodeAt(be);if (n === e) return ++be, i(je, r);if (92 === n) {
						n = de.charCodeAt(++be);var a = /^[0-7]+/.exec(de.slice(be, be + 3));for (a && (a = a[0]); a && parseInt(a, 8) > 255;) a = a.slice(0, -1);if ("0" === a && (a = null), ++be, a) Oe && t(be - 2, "Octal literal in strict mode"), r += String.fromCharCode(parseInt(a, 8)), be += a.length - 1;else switch (n) {case 110:
								r += "\n";break;case 114:
								r += "\r";break;case 120:
								r += String.fromCharCode(S(2));break;case 117:
								r += String.fromCharCode(S(4));break;case 85:
								r += String.fromCharCode(S(8));break;case 116:
								r += "\t";break;case 98:
								r += "\b";break;case 118:
								r += "\x0B";break;case 102:
								r += "\f";break;case 48:
								r += "\0";break;case 13:
								10 === de.charCodeAt(be) && ++be;case 10:
								fe.locations && (Se = be, ++Ae);break;default:
								r += String.fromCharCode(n);}
					} else 13 !== n && 10 !== n && 8232 !== n && 8233 !== n || t(ye, "Unterminated string constant"), r += String.fromCharCode(n), ++be;
				}
			}function S(e) {
				var r = w(16, e);return null === r && t(ye, "Bad character escape sequence"), r;
			}function I() {
				Br = !1;for (var e, r = !0, n = be;;) {
					var a = de.charCodeAt(be);if (Yr(a)) Br && (e += de.charAt(be)), ++be;else {
						if (92 !== a) break;Br || (e = de.slice(n, be)), Br = !0, 117 != de.charCodeAt(++be) && t(be, "Expecting Unicode escape sequence \\uXXXX"), ++be;var o = S(4),
						    i = String.fromCharCode(o);i || t(be - 1, "Invalid Unicode escape"), (r ? Qr(o) : Yr(o)) || t(be - 4, "Invalid Unicode escape"), e += i;
					}r = !1;
				}return Br ? e : de.slice(n, be);
			}function L() {
				var e = I(),
				    r = De;return !Br && Wr(e) && (r = lr[e]), i(r, e);
			}function U() {
				Ie = ye, Le = ge, Ue = ke, g();
			}function F(e) {
				if (Oe = e, be = ye, fe.locations) for (; be < Se;) Se = de.lastIndexOf("\n", Se - 2) + 1, --Ae;u(), g();
			}function R() {
				this.type = null, this.start = ye, this.end = null;
			}function O() {
				this.start = xe, this.end = null, null !== me && (this.source = me);
			}function V() {
				var e = new R();return fe.locations && (e.loc = new O()), fe.directSourceFile && (e.sourceFile = fe.directSourceFile), fe.ranges && (e.range = [ye, 0]), e;
			}function T(e) {
				var r = new R();return r.start = e.start, fe.locations && (r.loc = new O(), r.loc.start = e.loc.start), fe.ranges && (r.range = [e.range[0], 0]), r;
			}function q(e, r) {
				return e.type = r, e.end = Le, fe.locations && (e.loc.end = Ue), fe.ranges && (e.range[1] = Le), e;
			}function j(e) {
				return fe.ecmaVersion >= 5 && "ExpressionStatement" === e.type && "Literal" === e.expression.type && "use strict" === e.expression.value;
			}function D(e) {
				if (we === e) return U(), !0;
			}function B() {
				return !fe.strictSemicolons && (we === Be || we === mr || Gr.test(de.slice(Le, ye)));
			}function M() {
				D(yr) || B() || X();
			}function z(e) {
				we === e ? U() : X();
			}function X() {
				t(ye, "Unexpected token");
			}function N(e) {
				"Identifier" !== e.type && "MemberExpression" !== e.type && t(e.start, "Assigning to rvalue"), Oe && "Identifier" === e.type && Nr(e.name) && t(e.start, "Assigning to " + e.name + " in strict mode");
			}function W(e) {
				Ie = Le = be, fe.locations && (Ue = new a()), Fe = Oe = null, Re = [], g();var r = e || V(),
				    t = !0;for (e || (r.body = []); we !== Be;) {
					var n = J();r.body.push(n), t && j(n) && F(!0), t = !1;
				}return q(r, "Program");
			}function J() {
				(we === wr || we === Er && "/=" == Ce) && g(!0);var e = we,
				    r = V();switch (e) {case Me:case Ne:
						U();var n = e === Me;D(yr) || B() ? r.label = null : we !== De ? X() : (r.label = le(), M());for (var a = 0; a < Re.length; ++a) {
							var o = Re[a];if (null == r.label || o.name === r.label.name) {
								if (null != o.kind && (n || "loop" === o.kind)) break;if (r.label && n) break;
							}
						}return a === Re.length && t(r.start, "Unsyntactic " + e.keyword), q(r, n ? "BreakStatement" : "ContinueStatement");case We:
						return U(), M(), q(r, "DebuggerStatement");case Pe:
						return U(), Re.push(Zr), r.body = J(), Re.pop(), z(tr), r.test = P(), M(), q(r, "DoWhileStatement");case _e:
						if (U(), Re.push(Zr), z(hr), we === yr) return $(r, null);if (we === rr) {
							var i = V();return U(), G(i, !0), q(i, "VariableDeclaration"), 1 === i.declarations.length && D(ur) ? _(r, i) : $(r, i);
						}var i = K(!1, !0);return D(ur) ? (N(i), _(r, i)) : $(r, i);case Ge:
						return U(), ce(r, !0);case Ke:
						return U(), r.test = P(), r.consequent = J(), r.alternate = D(He) ? J() : null, q(r, "IfStatement");case Qe:
						return Fe || fe.allowReturnOutsideFunction || t(ye, "'return' outside of function"), U(), D(yr) || B() ? r.argument = null : (r.argument = K(), M()), q(r, "ReturnStatement");case Ye:
						U(), r.discriminant = P(), r.cases = [], z(pr), Re.push(et);for (var s, c; we != mr;) if (we === ze || we === Je) {
							var u = we === ze;s && q(s, "SwitchCase"), r.cases.push(s = V()), s.consequent = [], U(), u ? s.test = K() : (c && t(Ie, "Multiple default clauses"), c = !0, s.test = null), z(gr);
						} else s || X(), s.consequent.push(J());return s && q(s, "SwitchCase"), U(), Re.pop(), q(r, "SwitchStatement");case Ze:
						return U(), Gr.test(de.slice(Le, ye)) && t(Le, "Illegal newline after throw"), r.argument = K(), M(), q(r, "ThrowStatement");case er:
						if (U(), r.block = H(), r.handler = null, we === Xe) {
							var l = V();U(), z(hr), l.param = le(), Oe && Nr(l.param.name) && t(l.param.start, "Binding " + l.param.name + " in strict mode"), z(vr), l.guard = null, l.body = H(), r.handler = q(l, "CatchClause");
						}return r.guardedHandlers = Ve, r.finalizer = D($e) ? H() : null, r.handler || r.finalizer || t(r.start, "Missing catch or finally clause"), q(r, "TryStatement");case rr:
						return U(), G(r), M(), q(r, "VariableDeclaration");case tr:
						return U(), r.test = P(), Re.push(Zr), r.body = J(), Re.pop(), q(r, "WhileStatement");case nr:
						return Oe && t(ye, "'with' in strict mode"), U(), r.object = P(), r.body = J(), q(r, "WithStatement");case pr:
						return H();case yr:
						return U(), q(r, "EmptyStatement");default:
						var f = Ce,
						    d = K();if (e === De && "Identifier" === d.type && D(gr)) {
							for (var a = 0; a < Re.length; ++a) Re[a].name === f && t(d.start, "Label '" + f + "' is already declared");var p = we.isLoop ? "loop" : we === Ye ? "switch" : null;return Re.push({ name: f, kind: p }), r.body = J(), Re.pop(), r.label = d, q(r, "LabeledStatement");
						}return r.expression = d, M(), q(r, "ExpressionStatement");}
			}function P() {
				z(hr);var e = K();return z(vr), e;
			}function H(e) {
				var r,
				    t = V(),
				    n = !0,
				    a = !1;for (t.body = [], z(pr); !D(mr);) {
					var o = J();t.body.push(o), n && e && j(o) && (r = a, F(a = !0)), n = !1;
				}return a && !r && F(!1), q(t, "BlockStatement");
			}function $(e, r) {
				return e.init = r, z(yr), e.test = we === yr ? null : K(), z(yr), e.update = we === vr ? null : K(), z(vr), e.body = J(), Re.pop(), q(e, "ForStatement");
			}function _(e, r) {
				return e.left = r, e.right = K(), z(vr), e.body = J(), Re.pop(), q(e, "ForInStatement");
			}function G(e, r) {
				for (e.declarations = [], e.kind = "var";;) {
					var n = V();if (n.id = le(), Oe && Nr(n.id.name) && t(n.id.start, "Binding " + n.id.name + " in strict mode"), n.init = D(Cr) ? K(!0, r) : null, e.declarations.push(q(n, "VariableDeclarator")), !D(br)) break;
				}return e;
			}function K(e, r) {
				var t = Q(r);if (!e && we === br) {
					var n = T(t);for (n.expressions = [t]; D(br);) n.expressions.push(Q(r));return q(n, "SequenceExpression");
				}return t;
			}function Q(e) {
				var r = Y(e);if (we.isAssign) {
					var t = T(r);return t.operator = Ce, t.left = r, U(), t.right = Q(e), N(r), q(t, "AssignmentExpression");
				}return r;
			}function Y(e) {
				var r = Z(e);if (D(kr)) {
					var t = T(r);return t.test = r, t.consequent = K(!0), z(gr), t.alternate = K(!0, e), q(t, "ConditionalExpression");
				}return r;
			}function Z(e) {
				return ee(re(), -1, e);
			}function ee(e, r, t) {
				var n = we.binop;if (null != n && (!t || we !== ur) && n > r) {
					var a = T(e);a.left = e, a.operator = Ce;var o = we;U(), a.right = ee(re(), n, t);var i = q(a, o === Ir || o === Lr ? "LogicalExpression" : "BinaryExpression");return ee(i, r, t);
				}return e;
			}function re() {
				if (we.prefix) {
					var e = V(),
					    r = we.isUpdate;return e.operator = Ce, e.prefix = !0, Ee = !0, U(), e.argument = re(), r ? N(e.argument) : Oe && "delete" === e.operator && "Identifier" === e.argument.type && t(e.start, "Deleting local variable in strict mode"), q(e, r ? "UpdateExpression" : "UnaryExpression");
				}for (var n = te(); we.postfix && !B();) {
					var e = T(n);e.operator = Ce, e.prefix = !1, e.argument = n, N(n), U(), n = q(e, "UpdateExpression");
				}return n;
			}function te() {
				return ne(ae());
			}function ne(e, r) {
				if (D(xr)) {
					var t = T(e);return t.object = e, t.property = le(!0), t.computed = !1, ne(q(t, "MemberExpression"), r);
				}if (D(fr)) {
					var t = T(e);return t.object = e, t.property = K(), t.computed = !0, z(dr), ne(q(t, "MemberExpression"), r);
				}if (!r && D(hr)) {
					var t = T(e);return t.callee = e, t.arguments = ue(vr, !1), ne(q(t, "CallExpression"), r);
				}return e;
			}function ae() {
				switch (we) {case or:
						var e = V();return U(), q(e, "ThisExpression");case De:
						return le();case Te:case je:case qe:
						var e = V();return e.value = Ce, e.raw = de.slice(ye, ge), U(), q(e, "Literal");case ir:case sr:case cr:
						var e = V();return e.value = we.atomValue, e.raw = we.keyword, U(), q(e, "Literal");case hr:
						var r = xe,
						    t = ye;U();var n = K();return n.start = t, n.end = ge, fe.locations && (n.loc.start = r, n.loc.end = ke), fe.ranges && (n.range = [t, ge]), z(vr), n;case fr:
						var e = V();return U(), e.elements = ue(dr, !0, !0), q(e, "ArrayExpression");case pr:
						return ie();case Ge:
						var e = V();return U(), ce(e, !1);case ar:
						return oe();default:
						X();}
			}function oe() {
				var e = V();return U(), e.callee = ne(ae(), !0), D(hr) ? e.arguments = ue(vr, !1) : e.arguments = Ve, q(e, "NewExpression");
			}function ie() {
				var e = V(),
				    r = !0,
				    n = !1;for (e.properties = [], U(); !D(mr);) {
					if (r) r = !1;else if (z(br), fe.allowTrailingCommas && D(mr)) break;var a,
					    o = { key: se() },
					    i = !1;if (D(gr) ? (o.value = K(!0), a = o.kind = "init") : fe.ecmaVersion >= 5 && "Identifier" === o.key.type && ("get" === o.key.name || "set" === o.key.name) ? (i = n = !0, a = o.kind = o.key.name, o.key = se(), we !== hr && X(), o.value = ce(V(), !1)) : X(), "Identifier" === o.key.type && (Oe || n)) for (var s = 0; s < e.properties.length; ++s) {
						var c = e.properties[s];if (c.key.name === o.key.name) {
							var u = a == c.kind || i && "init" === c.kind || "init" === a && ("get" === c.kind || "set" === c.kind);u && !Oe && "init" === a && "init" === c.kind && (u = !1), u && t(o.key.start, "Redefinition of property");
						}
					}e.properties.push(o);
				}return q(e, "ObjectExpression");
			}function se() {
				return we === Te || we === je ? ae() : le(!0);
			}function ce(e, r) {
				we === De ? e.id = le() : r ? X() : e.id = null, e.params = [];var n = !0;for (z(hr); !D(vr);) n ? n = !1 : z(br), e.params.push(le());var a = Fe,
				    o = Re;if (Fe = !0, Re = [], e.body = H(!0), Fe = a, Re = o, Oe || e.body.body.length && j(e.body.body[0])) for (var i = e.id ? -1 : 0; i < e.params.length; ++i) {
					var s = i < 0 ? e.id : e.params[i];if ((Xr(s.name) || Nr(s.name)) && t(s.start, "Defining '" + s.name + "' in strict mode"), i >= 0) for (var c = 0; c < i; ++c) s.name === e.params[c].name && t(s.start, "Argument name clash in strict mode");
				}return q(e, r ? "FunctionDeclaration" : "FunctionExpression");
			}function ue(e, r, t) {
				for (var n = [], a = !0; !D(e);) {
					if (a) a = !1;else if (z(br), r && fe.allowTrailingCommas && D(e)) break;t && we === br ? n.push(null) : n.push(K(!0));
				}return n;
			}function le(e) {
				var r = V();return e && "everywhere" == fe.forbidReserved && (e = !1), we === De ? (!e && (fe.forbidReserved && (3 === fe.ecmaVersion ? Mr : zr)(Ce) || Oe && Xr(Ce)) && de.slice(ye, ge).indexOf("\\") == -1 && t(ye, "The keyword '" + Ce + "' is reserved"), r.name = Ce) : e && we.keyword ? r.name = we.keyword : X(), Ee = !1, U(), q(r, "Identifier");
			}e.version = "0.5.0";var fe, de, pe, me;e.parse = function (e, t) {
				return de = String(e), pe = de.length, r(t), o(), W(fe.program);
			};var he = e.defaultOptions = { ecmaVersion: 5, strictSemicolons: !1, allowTrailingCommas: !0, forbidReserved: !1, allowReturnOutsideFunction: !1, locations: !1, onComment: null, ranges: !1, program: null, sourceFile: null, directSourceFile: null },
			    ve = e.getLineInfo = function (e, r) {
				for (var t = 1, n = 0;;) {
					Kr.lastIndex = n;var a = Kr.exec(e);if (!(a && a.index < r)) break;++t, n = a.index + a[0].length;
				}return { line: t, column: r - n };
			};e.tokenize = function (e, t) {
				function n(e) {
					return Le = ge, g(e), a.start = ye, a.end = ge, a.startLoc = xe, a.endLoc = ke, a.type = we, a.value = Ce, a;
				}de = String(e), pe = de.length, r(t), o();var a = {};return n.jumpTo = function (e, r) {
					if (be = e, fe.locations) {
						Ae = 1, Se = Kr.lastIndex = 0;for (var t; (t = Kr.exec(de)) && t.index < e;) ++Ae, Se = t.index + t[0].length;
					}Ee = r, u();
				}, n;
			};var be,
			    ye,
			    ge,
			    xe,
			    ke,
			    we,
			    Ce,
			    Ee,
			    Ae,
			    Se,
			    Ie,
			    Le,
			    Ue,
			    Fe,
			    Re,
			    Oe,
			    Ve = [],
			    Te = { type: "num" },
			    qe = { type: "regexp" },
			    je = { type: "string" },
			    De = { type: "name" },
			    Be = { type: "eof" },
			    Me = { keyword: "break" },
			    ze = { keyword: "case", beforeExpr: !0 },
			    Xe = { keyword: "catch" },
			    Ne = { keyword: "continue" },
			    We = { keyword: "debugger" },
			    Je = { keyword: "default" },
			    Pe = { keyword: "do", isLoop: !0 },
			    He = { keyword: "else", beforeExpr: !0 },
			    $e = { keyword: "finally" },
			    _e = { keyword: "for", isLoop: !0 },
			    Ge = { keyword: "function" },
			    Ke = { keyword: "if" },
			    Qe = { keyword: "return", beforeExpr: !0 },
			    Ye = { keyword: "switch" },
			    Ze = { keyword: "throw", beforeExpr: !0 },
			    er = { keyword: "try" },
			    rr = { keyword: "var" },
			    tr = { keyword: "while", isLoop: !0 },
			    nr = { keyword: "with" },
			    ar = { keyword: "new", beforeExpr: !0 },
			    or = { keyword: "this" },
			    ir = { keyword: "null", atomValue: null },
			    sr = { keyword: "true", atomValue: !0 },
			    cr = { keyword: "false", atomValue: !1 },
			    ur = { keyword: "in", binop: 7, beforeExpr: !0 },
			    lr = { "break": Me, "case": ze, "catch": Xe, "continue": Ne, "debugger": We, "default": Je, "do": Pe, "else": He, "finally": $e, "for": _e, "function": Ge, "if": Ke, "return": Qe, "switch": Ye, "throw": Ze, "try": er, "var": rr, "while": tr, "with": nr, "null": ir, "true": sr, "false": cr, "new": ar, "in": ur, "instanceof": { keyword: "instanceof", binop: 7, beforeExpr: !0 }, "this": or, "typeof": { keyword: "typeof", prefix: !0, beforeExpr: !0 }, "void": { keyword: "void", prefix: !0, beforeExpr: !0 }, "delete": { keyword: "delete", prefix: !0, beforeExpr: !0 } },
			    fr = { type: "[", beforeExpr: !0 },
			    dr = { type: "]" },
			    pr = { type: "{", beforeExpr: !0 },
			    mr = { type: "}" },
			    hr = { type: "(", beforeExpr: !0 },
			    vr = { type: ")" },
			    br = { type: ",", beforeExpr: !0 },
			    yr = { type: ";", beforeExpr: !0 },
			    gr = { type: ":", beforeExpr: !0 },
			    xr = { type: "." },
			    kr = { type: "?", beforeExpr: !0 },
			    wr = { binop: 10, beforeExpr: !0 },
			    Cr = { isAssign: !0, beforeExpr: !0 },
			    Er = { isAssign: !0, beforeExpr: !0 },
			    Ar = { postfix: !0, prefix: !0, isUpdate: !0 },
			    Sr = { prefix: !0, beforeExpr: !0 },
			    Ir = { binop: 1, beforeExpr: !0 },
			    Lr = { binop: 2, beforeExpr: !0 },
			    Ur = { binop: 3, beforeExpr: !0 },
			    Fr = { binop: 4, beforeExpr: !0 },
			    Rr = { binop: 5, beforeExpr: !0 },
			    Or = { binop: 6, beforeExpr: !0 },
			    Vr = { binop: 7, beforeExpr: !0 },
			    Tr = { binop: 8, beforeExpr: !0 },
			    qr = { binop: 9, prefix: !0, beforeExpr: !0 },
			    jr = { binop: 10, beforeExpr: !0 };e.tokTypes = { bracketL: fr, bracketR: dr, braceL: pr, braceR: mr, parenL: hr, parenR: vr, comma: br, semi: yr, colon: gr, dot: xr, question: kr, slash: wr, eq: Cr, name: De, eof: Be, num: Te, regexp: qe, string: je };for (var Dr in lr) e.tokTypes["_" + Dr] = lr[Dr];var Br,
			    Mr = n("abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile"),
			    zr = n("class enum extends super const export import"),
			    Xr = n("implements interface let package private protected public static yield"),
			    Nr = n("eval arguments"),
			    Wr = n("break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this"),
			    Jr = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/,
			    Pr = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc",
			    Hr = "\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u0620-\u0649\u0672-\u06d3\u06e7-\u06e8\u06fb-\u06fc\u0730-\u074a\u0800-\u0814\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0840-\u0857\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962-\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09d7\u09df-\u09e0\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5f-\u0b60\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2-\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d46-\u0d48\u0d57\u0d62-\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e34-\u0e3a\u0e40-\u0e45\u0e50-\u0e59\u0eb4-\u0eb9\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f41-\u0f47\u0f71-\u0f84\u0f86-\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1029\u1040-\u1049\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u170e-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17b2\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1920-\u192b\u1930-\u193b\u1951-\u196d\u19b0-\u19c0\u19c8-\u19c9\u19d0-\u19d9\u1a00-\u1a15\u1a20-\u1a53\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b46-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1bb0-\u1bb9\u1be6-\u1bf3\u1c00-\u1c22\u1c40-\u1c49\u1c5b-\u1c7d\u1cd0-\u1cd2\u1d00-\u1dbe\u1e01-\u1f15\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2d81-\u2d96\u2de0-\u2dff\u3021-\u3028\u3099\u309a\ua640-\ua66d\ua674-\ua67d\ua69f\ua6f0-\ua6f1\ua7f8-\ua800\ua806\ua80b\ua823-\ua827\ua880-\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8f3-\ua8f7\ua900-\ua909\ua926-\ua92d\ua930-\ua945\ua980-\ua983\ua9b3-\ua9c0\uaa00-\uaa27\uaa40-\uaa41\uaa4c-\uaa4d\uaa50-\uaa59\uaa7b\uaae0-\uaae9\uaaf2-\uaaf3\uabc0-\uabe1\uabec\uabed\uabf0-\uabf9\ufb20-\ufb28\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f",
			    $r = new RegExp("[" + Pr + "]"),
			    _r = new RegExp("[" + Pr + Hr + "]"),
			    Gr = /[\n\r\u2028\u2029]/,
			    Kr = /\r\n|[\n\r\u2028\u2029]/g,
			    Qr = e.isIdentifierStart = function (e) {
				return e < 65 ? 36 === e : e < 91 || (e < 97 ? 95 === e : e < 123 || e >= 170 && $r.test(String.fromCharCode(e)));
			},
			    Yr = e.isIdentifierChar = function (e) {
				return e < 48 ? 36 === e : e < 58 || !(e < 65) && (e < 91 || (e < 97 ? 95 === e : e < 123 || e >= 170 && _r.test(String.fromCharCode(e))));
			},
			    Zr = { kind: "loop" },
			    et = { kind: "switch" };
		});

		var binaryOperators = {
			'+': '__add',
			'-': '__subtract',
			'*': '__multiply',
			'/': '__divide',
			'%': '__modulo',
			'==': '__equals',
			'!=': '__equals'
		};

		var unaryOperators = {
			'-': '__negate',
			'+': null
		};

		var fields = Base.each(['add', 'subtract', 'multiply', 'divide', 'modulo', 'equals', 'negate'], function (name) {
			this['__' + name] = '#' + name;
		}, {});
		Point.inject(fields);
		Size.inject(fields);
		Color.inject(fields);

		function __$__(left, operator, right) {
			var handler = binaryOperators[operator];
			if (left && left[handler]) {
				var res = left[handler](right);
				return operator === '!=' ? !res : res;
			}
			switch (operator) {
				case '+':
					return left + right;
				case '-':
					return left - right;
				case '*':
					return left * right;
				case '/':
					return left / right;
				case '%':
					return left % right;
				case '==':
					return left == right;
				case '!=':
					return left != right;
			}
		}

		function $__(operator, value) {
			var handler = unaryOperators[operator];
			if (handler && value && value[handler]) return value[handler]();
			switch (operator) {
				case '+':
					return +value;
				case '-':
					return -value;
			}
		}

		function parse(code, options) {
			return scope.acorn.parse(code, options);
		}

		function compile(code, options) {
			if (!code) return '';
			options = options || {};

			var insertions = [];

			function getOffset(offset) {
				for (var i = 0, l = insertions.length; i < l; i++) {
					var insertion = insertions[i];
					if (insertion[0] >= offset) break;
					offset += insertion[1];
				}
				return offset;
			}

			function getCode(node) {
				return code.substring(getOffset(node.range[0]), getOffset(node.range[1]));
			}

			function getBetween(left, right) {
				return code.substring(getOffset(left.range[1]), getOffset(right.range[0]));
			}

			function replaceCode(node, str) {
				var start = getOffset(node.range[0]),
				    end = getOffset(node.range[1]),
				    insert = 0;
				for (var i = insertions.length - 1; i >= 0; i--) {
					if (start > insertions[i][0]) {
						insert = i + 1;
						break;
					}
				}
				insertions.splice(insert, 0, [start, str.length - end + start]);
				code = code.substring(0, start) + str + code.substring(end);
			}

			function walkAST(node, parent) {
				if (!node) return;
				for (var key in node) {
					if (key === 'range' || key === 'loc') continue;
					var value = node[key];
					if (Array.isArray(value)) {
						for (var i = 0, l = value.length; i < l; i++) walkAST(value[i], node);
					} else if (value && typeof value === 'object') {
						walkAST(value, node);
					}
				}
				switch (node.type) {
					case 'UnaryExpression':
						if (node.operator in unaryOperators && node.argument.type !== 'Literal') {
							var arg = getCode(node.argument);
							replaceCode(node, '$__("' + node.operator + '", ' + arg + ')');
						}
						break;
					case 'BinaryExpression':
						if (node.operator in binaryOperators && node.left.type !== 'Literal') {
							var left = getCode(node.left),
							    right = getCode(node.right),
							    between = getBetween(node.left, node.right),
							    operator = node.operator;
							replaceCode(node, '__$__(' + left + ',' + between.replace(new RegExp('\\' + operator), '"' + operator + '"') + ', ' + right + ')');
						}
						break;
					case 'UpdateExpression':
					case 'AssignmentExpression':
						var parentType = parent && parent.type;
						if (!(parentType === 'ForStatement' || parentType === 'BinaryExpression' && /^[=!<>]/.test(parent.operator) || parentType === 'MemberExpression' && parent.computed)) {
							if (node.type === 'UpdateExpression') {
								var arg = getCode(node.argument),
								    exp = '__$__(' + arg + ', "' + node.operator[0] + '", 1)',
								    str = arg + ' = ' + exp;
								if (!node.prefix && (parentType === 'AssignmentExpression' || parentType === 'VariableDeclarator')) {
									if (getCode(parent.left || parent.id) === arg) str = exp;
									str = arg + '; ' + str;
								}
								replaceCode(node, str);
							} else {
								if (/^.=$/.test(node.operator) && node.left.type !== 'Literal') {
									var left = getCode(node.left),
									    right = getCode(node.right),
									    exp = left + ' = __$__(' + left + ', "' + node.operator[0] + '", ' + right + ')';
									replaceCode(node, /^\(.*\)$/.test(getCode(node)) ? '(' + exp + ')' : exp);
								}
							}
						}
						break;
				}
			}

			function encodeVLQ(value) {
				var res = '',
				    base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
				value = (Math.abs(value) << 1) + (value < 0 ? 1 : 0);
				while (value || !res) {
					var next = value & 32 - 1;
					value >>= 5;
					if (value) next |= 32;
					res += base64[next];
				}
				return res;
			}

			var url = options.url || '',
			    agent = paper.agent,
			    version = agent.versionNumber,
			    offsetCode = false,
			    sourceMaps = options.sourceMaps,
			    source = options.source || code,
			    lineBreaks = /\r\n|\n|\r/mg,
			    offset = options.offset || 0,
			    map;
			if (sourceMaps && (agent.chrome && version >= 30 || agent.webkit && version >= 537.76 || agent.firefox && version >= 23 || agent.node)) {
				if (agent.node) {
					offset -= 2;
				} else if (window && url && !window.location.href.indexOf(url)) {
					var html = document.getElementsByTagName('html')[0].innerHTML;
					offset = html.substr(0, html.indexOf(code) + 1).match(lineBreaks).length + 1;
				}
				offsetCode = offset > 0 && !(agent.chrome && version >= 36 || agent.safari && version >= 600 || agent.firefox && version >= 40 || agent.node);
				var mappings = ['AA' + encodeVLQ(offsetCode ? 0 : offset) + 'A'];
				mappings.length = (code.match(lineBreaks) || []).length + 1 + (offsetCode ? offset : 0);
				map = {
					version: 3,
					file: url,
					names: [],
					mappings: mappings.join(';AACA'),
					sourceRoot: '',
					sources: [url],
					sourcesContent: [source]
				};
			}
			walkAST(parse(code, { ranges: true }));
			if (map) {
				if (offsetCode) {
					code = new Array(offset + 1).join('\n') + code;
				}
				if (/^(inline|both)$/.test(sourceMaps)) {
					code += "\n//# sourceMappingURL=data:application/json;base64," + self.btoa(unescape(encodeURIComponent(JSON.stringify(map))));
				}
				code += "\n//# sourceURL=" + (url || 'paperscript');
			}
			return {
				url: url,
				source: source,
				code: code,
				map: map
			};
		}

		function execute(code, scope, options) {
			paper = scope;
			var view = scope.getView(),
			    tool = /\btool\.\w+|\s+on(?:Key|Mouse)(?:Up|Down|Move|Drag)\b/.test(code) && !/\bnew\s+Tool\b/.test(code) ? new Tool() : null,
			    toolHandlers = tool ? tool._events : [],
			    handlers = ['onFrame', 'onResize'].concat(toolHandlers),
			    params = [],
			    args = [],
			    func,
			    compiled = typeof code === 'object' ? code : compile(code, options);
			code = compiled.code;
			function expose(scope, hidden) {
				for (var key in scope) {
					if ((hidden || !/^_/.test(key)) && new RegExp('([\\b\\s\\W]|^)' + key.replace(/\$/g, '\\$') + '\\b').test(code)) {
						params.push(key);
						args.push(scope[key]);
					}
				}
			}
			expose({ __$__: __$__, $__: $__, paper: scope, view: view, tool: tool }, true);
			expose(scope);
			handlers = Base.each(handlers, function (key) {
				if (new RegExp('\\s+' + key + '\\b').test(code)) {
					params.push(key);
					this.push(key + ': ' + key);
				}
			}, []).join(', ');
			if (handlers) code += '\nreturn { ' + handlers + ' };';
			var agent = paper.agent;
			if (document && (agent.chrome || agent.firefox && agent.versionNumber < 40)) {
				var script = document.createElement('script'),
				    head = document.head || document.getElementsByTagName('head')[0];
				if (agent.firefox) code = '\n' + code;
				script.appendChild(document.createTextNode('paper._execute = function(' + params + ') {' + code + '\n}'));
				head.appendChild(script);
				func = paper._execute;
				delete paper._execute;
				head.removeChild(script);
			} else {
				func = Function(params, code);
			}
			var res = func.apply(scope, args) || {};
			Base.each(toolHandlers, function (key) {
				var value = res[key];
				if (value) tool[key] = value;
			});
			if (view) {
				if (res.onResize) view.setOnResize(res.onResize);
				view.emit('resize', {
					size: view.size,
					delta: new Point()
				});
				if (res.onFrame) view.setOnFrame(res.onFrame);
				view.requestUpdate();
			}
			return compiled;
		}

		function loadScript(script) {
			if (/^text\/(?:x-|)paperscript$/.test(script.type) && PaperScope.getAttribute(script, 'ignore') !== 'true') {
				var canvasId = PaperScope.getAttribute(script, 'canvas'),
				    canvas = document.getElementById(canvasId),
				    src = script.src || script.getAttribute('data-src'),
				    async = PaperScope.hasAttribute(script, 'async'),
				    scopeAttribute = 'data-paper-scope';
				if (!canvas) throw new Error('Unable to find canvas with id "' + canvasId + '"');
				var scope = PaperScope.get(canvas.getAttribute(scopeAttribute)) || new PaperScope().setup(canvas);
				canvas.setAttribute(scopeAttribute, scope._id);
				if (src) {
					Http.request({
						url: src,
						async: async,
						mimeType: 'text/plain',
						onLoad: function (code) {
							execute(code, scope, src);
						}
					});
				} else {
					execute(script.innerHTML, scope, script.baseURI);
				}
				script.setAttribute('data-paper-ignore', 'true');
				return scope;
			}
		}

		function loadAll() {
			Base.each(document && document.getElementsByTagName('script'), loadScript);
		}

		function load(script) {
			return script ? loadScript(script) : loadAll();
		}

		if (window) {
			if (document.readyState === 'complete') {
				setTimeout(loadAll);
			} else {
				DomEvent.add(window, { load: loadAll });
			}
		}

		return {
			compile: compile,
			execute: execute,
			load: load,
			parse: parse
		};
	}.call(this);

	paper = new (PaperScope.inject(Base.exports, {
		enumerable: true,
		Base: Base,
		Numerical: Numerical,
		Key: Key,
		DomEvent: DomEvent,
		DomElement: DomElement,
		document: document,
		window: window,
		Symbol: SymbolDefinition,
		PlacedSymbol: SymbolItem
	}))();

	if (paper.agent.node) require('./node/extend.js')(paper);

	if ('function' === 'function' && true) {
		System.registerDynamic('github:paperjs/paper.js@0.10.3/dist/paper-full.js', [], false, function ($__require, $__exports, $__module) {
			if (typeof paper === 'function') {
				return paper.call(this);
			} else {
				return paper;
			}
		});
	} else if (typeof module === 'object' && module) {
		module.exports = paper;
	}

	return paper;
}.call(this, typeof self === 'object' ? self : null);
System.register('js/shapeshift.js', ['npm:systemjs-plugin-babel@0.0.21/babel-helpers/classCallCheck.js', 'npm:systemjs-plugin-babel@0.0.21/babel-helpers/createClass.js', 'paper', './utils.js'], function (_export, _context) {
  "use strict";

  var _classCallCheck, _createClass, paper, mergeDeep, Shapeshift;

  return {
    setters: [function (_npmSystemjsPluginBabel0021BabelHelpersClassCallCheckJs) {
      _classCallCheck = _npmSystemjsPluginBabel0021BabelHelpersClassCallCheckJs.default;
    }, function (_npmSystemjsPluginBabel0021BabelHelpersCreateClassJs) {
      _createClass = _npmSystemjsPluginBabel0021BabelHelpersCreateClassJs.default;
    }, function (_paper) {
      paper = _paper.default;
    }, function (_utilsJs) {
      mergeDeep = _utilsJs.mergeDeep;
    }],
    execute: function () {
      Shapeshift = function () {
        function Shapeshift(element, config) {
          _classCallCheck(this, Shapeshift);

          this.element = element;
          this.config = config;

          // the default config parameters
          this.defaults = {
            anchors: 10, // amount of anchor points
            rings: 10, // amount of rings
            length: 1, // 1 = full closed path, percentage of the total possible length, number < 1 = open path
            minRingScale: 0, // minimum scale of the most inner ring compared to the outer ring (min = 0, max = 1)
            smooth: true, // smooth the path
            debug: false, // show debug view
            center: [0.5, 0.5], // magnetic center, in percentages from the canvas
            ringstyle: {
              alphaMode: 'none', // none, fade-in, fade-out
              alphaModeMin: 0, // the lowest possible alpha value
              strokeColor: '#000', // ['#1b52ff', '#0f2d8c'], //['#1b52ff', '#ff0000'], //['#1b52ff', '#0f2d8c'],    // when solid, hex as string, when gradient: array up/down color
              // dashArray: [2, 4],   // add this property to create a dotted/dashed line
              strokeWidth: 1, // what it says
              strokeCap: 'round' // cap of strokes, useful in combination with dasharray to create dotted/dashed lines
            },
            animation: {
              speed: 0.1, // animation speed
              reposition: 'random', // reposition all targets per interval (all), or only 1 random (random)
              interval: 750 // the interval between target changes
            }
          };

          // merge defaults with incoming config parameters
          this.config = mergeDeep(this.defaults, this.config);

          // the elapsed time
          this.time = 0;

          // setup and resize once
          this.setup();
          this.resize();
        }

        // stuff we need to do only once


        _createClass(Shapeshift, [{
          key: 'setup',
          value: function setup() {
            if (this.canvas) return;

            // create canvas, init paper, append to parent
            this.canvas = document.createElement('canvas');
            this.scope = new paper.PaperScope();
            this.scope.setup(this.canvas);
            this.element.appendChild(this.canvas);
          }

          // stuff we need to do to re-init the drawing

        }, {
          key: 'init',
          value: function init() {
            var _this = this;

            if (!this.canvas) return;

            // reset drawing when initializing again
            if (this.scope) this.reset();

            // activate this scope
            this.scope.activate();

            // reset variables
            this.anchors = [];
            this.targets = [];

            // set the center
            this.center = new this.scope.Point(this.sceneWidth * this.config.center[0], this.sceneHeight * this.config.center[1]);

            // create helper ellipse
            var helper = new this.scope.Path.Ellipse(new this.scope.Rectangle(new this.scope.Point(0, 0), new this.scope.Size(this.sceneWidth, this.sceneHeight)));
            helper.scale(0.99);

            // pick anchor config amount of points on the ellipse
            // if playRoomPerc was set, the positions are offset a bit for more randomness
            for (var i = 0; i < this.config.anchors; i++) {
              this.anchors.push(helper.getPointAt(i * helper.length / this.config.anchors));
            } // if path isn't closed, copy over last point to last position
            if (this.config.length < 1) this.anchors.push(this.anchors[0].clone());

            // calculate first targets
            this.recalculateTargets();

            // the main path
            this.path = new this.scope.Path(Object.assign({
              segments: this.targets,
              visible: false,
              closed: this.config.length >= 1
            }, this.config.ringstyle));

            // color the main path as a gradient?
            if (typeof this.config.ringstyle.strokeColor !== 'string') this.path.strokeColor = this.generateGradient(this.config.ringstyle.strokeColor[0], this.config.ringstyle.strokeColor[1]);

            // smooth the main path?
            if (this.config.smooth) this.path.smooth();

            // shorten the path if open path was set
            if (this.config.length < 1) this.path.splitAt(this.path.length * this.config.length);

            // create the inward copy paths
            this.copies = [];
            for (var _i = 0; _i < this.config.rings; _i++) {
              var copy = this.path.clone();
              copy.visible = true;
              this.copies.push(copy);
            }

            // set some debugging
            if (this.config.debug) {
              helper.selected = true;
              this.path.selected = true;
              new this.scope.Path.Circle({ center: this.center, radius: 3, fillColor: 'green' });
              this.targetDebugCircles = this.targets.map(function (target) {
                return new _this.scope.Path.Circle({ center: target, radius: 3, fillColor: 'red' });
              });
            }

            // throw error when trying to use alpha mode in combination with a gradient
            if (typeof this.config.ringstyle.strokeColor !== 'string' && this.config.ringstyle.alphaMode !== 'none') throw new Error('Using alphaMode and a gradient stroke color is not supported.');
          }

          // reset the canvas

        }, {
          key: 'reset',
          value: function reset() {
            if (!this.scope) return;

            // active this scope before removing stuff
            this.scope.activate();

            // remove children drawings from active layer
            this.scope.project.activeLayer.removeChildren();

            // reset vars
            this.path = null;
            this.copies = null;
          }

          // update loop

        }, {
          key: 'update',
          value: function update() {
            var _this2 = this;

            if (!this.path) return;

            // recalculate new target points
            if (Date.now() > this.time + this.config.animation.interval) {
              this.time = Date.now();
              this.config.animation.reposition === 'all' ? this.recalculateTargets() : this.recalculateRandomTarget();
            }

            // move path closer to target points
            this.path.segments.forEach(function (segment, i) {
              var dx = _this2.targets[i].x - segment.point.x;
              var dy = _this2.targets[i].y - segment.point.y;
              var angle = Math.atan2(dy, dx);
              var velX = Math.cos(angle) * _this2.config.animation.speed;
              var velY = Math.sin(angle) * _this2.config.animation.speed;

              _this2.path.segments[i].point.x += velX;
              _this2.path.segments[i].point.y += velY;
            });

            // sync copies to main path
            this.copies.forEach(function (copy, i) {
              copy.segments = _this2.path.segments;
              copy.scale(1 - i * (1 - _this2.config.minRingScale) / _this2.config.rings);

              // reapply color (fixes render bug when using gradients)
              copy.strokeColor = typeof _this2.config.ringstyle.strokeColor !== 'string' ? _this2.generateGradient(_this2.config.ringstyle.strokeColor[0], _this2.config.ringstyle.strokeColor[1]) : _this2.config.ringstyle.strokeColor;

              // fade outwards
              if (_this2.config.ringstyle.alphaMode === 'fade-out') copy.strokeColor.alpha = _this2.config.ringstyle.alphaModeMin + i * (1 - _this2.config.ringstyle.alphaModeMin) / _this2.config.rings;

              // fade inwards
              if (_this2.config.ringstyle.alphaMode === 'fade-in') copy.strokeColor.alpha = 1 - i * (1 - _this2.config.ringstyle.alphaModeMin) / _this2.config.rings;
            });
          }

          // draw loop

        }, {
          key: 'draw',
          value: function draw() {
            if (!this.scope) return;

            this.scope.activate();
            this.scope.view.draw();
          }

          // resize the drawing

        }, {
          key: 'resize',
          value: function resize() {
            if (!this.scope) return;

            // update vars
            this.sceneWidth = this.element.offsetWidth;
            this.sceneHeight = this.element.offsetHeight;

            // resize
            this.scope.view.viewSize.width = this.sceneWidth;
            this.scope.view.viewSize.height = this.sceneHeight;

            // re-init the shape
            this.init();
          }

          // recalculate target positions

        }, {
          key: 'recalculateTargets',
          value: function recalculateTargets() {
            var _this3 = this;

            this.targets = this.anchors.map(function (anchor) {
              return _this3.midpoint(_this3.center, anchor, 0.15 + Math.random() * 0.85);
            });
            if (this.config.debug) this.repositionDebugTargets();
          }

          // recalculate a random target position

        }, {
          key: 'recalculateRandomTarget',
          value: function recalculateRandomTarget() {
            var randomIndex = parseInt(Math.round(Math.random() * (this.targets.length - 1)), 10);
            this.targets[randomIndex] = this.midpoint(this.center, this.anchors[randomIndex], 0.15 + Math.random() * 0.85);
            if (this.config.debug) this.repositionDebugTargets();
          }

          // reposition the target debug circles to match their data model

        }, {
          key: 'repositionDebugTargets',
          value: function repositionDebugTargets() {
            var _this4 = this;

            if (!this.targetDebugCircles) return;
            this.targetDebugCircles.forEach(function (circle, i) {
              circle.position = _this4.targets[i];
            });
          }

          // utility function to find the midpoint at a certain percentage between 2 other points

        }, {
          key: 'midpoint',
          value: function midpoint(center, anchor, perc) {
            return new this.scope.Point(center.x + (anchor.x - center.x) * perc, center.y + (anchor.y - center.y) * perc);
          }

          // utility function to generate a paperjs gradient object

        }, {
          key: 'generateGradient',
          value: function generateGradient(up, down) {
            return {
              gradient: {
                stops: [up, down]
              },
              origin: [0, 0],
              destination: [0, this.sceneHeight]
            };
          }
        }]);

        return Shapeshift;
      }();

      _export('default', Shapeshift);
    }
  };
});
System.registerDynamic("npm:systemjs-plugin-babel@0.0.21.json", [], true, function() {
  return {
    "main": "plugin-babel.js",
    "map": {
      "systemjs-babel-build": {
        "browser": "./systemjs-babel-browser.js",
        "default": "./systemjs-babel-browser.js"
      }
    },
    "meta": {
      "./plugin-babel.js": {
        "format": "cjs"
      }
    }
  };
});

System.register("npm:systemjs-plugin-babel@0.0.21/babel-helpers/defineProperty.js", [], function (_export, _context) {
  "use strict";

  return {
    setters: [],
    execute: function () {
      _export("default", function (obj, key, value) {
        if (key in obj) {
          Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
          });
        } else {
          obj[key] = value;
        }

        return obj;
      });
    }
  };
});
System.register('js/utils.js', ['npm:systemjs-plugin-babel@0.0.21/babel-helpers/defineProperty.js'], function (_export, _context) {
  "use strict";

  var _defineProperty;

  /**
    * Simple is object check.
    * @param item
    * @returns {boolean}
    */
  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item) && item !== null;
  }

  /**
    * Deep merge two objects.
    * @param target
    * @param source
    */

  _export('isObject', isObject);

  function mergeDeep(target, source) {
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(function (key) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, _defineProperty({}, key, {}));
          mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, _defineProperty({}, key, source[key]));
        }
      });
    }
    return target;
  }
  _export('mergeDeep', mergeDeep);

  function hasClass(ele, cls) {
    return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
  }
  _export('hasClass', hasClass);

  return {
    setters: [function (_npmSystemjsPluginBabel0021BabelHelpersDefinePropertyJs) {
      _defineProperty = _npmSystemjsPluginBabel0021BabelHelpersDefinePropertyJs.default;
    }],
    execute: function () {}
  };
});
System.register('js/app.js', ['npm:systemjs-plugin-babel@0.0.21/babel-helpers/classCallCheck.js', 'npm:systemjs-plugin-babel@0.0.21/babel-helpers/createClass.js', 'gsap', './shapeshift.js', './utils.js'], function (_export, _context) {
  "use strict";

  var _classCallCheck, _createClass, TweenMax, Shapeshift, hasClass, App, app;

  return {
    setters: [function (_npmSystemjsPluginBabel0021BabelHelpersClassCallCheckJs) {
      _classCallCheck = _npmSystemjsPluginBabel0021BabelHelpersClassCallCheckJs.default;
    }, function (_npmSystemjsPluginBabel0021BabelHelpersCreateClassJs) {
      _createClass = _npmSystemjsPluginBabel0021BabelHelpersCreateClassJs.default;
    }, function (_gsap) {
      TweenMax = _gsap.default;
    }, function (_shapeshiftJs) {
      Shapeshift = _shapeshiftJs.default;
    }, function (_utilsJs) {
      hasClass = _utilsJs.hasClass;
    }],
    execute: function () {
      App = function () {
        function App() {
          _classCallCheck(this, App);

          this.config = {};

          this.shapes = [];

          this.init();
          this.resize();
        }

        _createClass(App, [{
          key: 'init',
          value: function init() {
            var _this = this;

            if (hasClass(document.getElementsByTagName('body')[0], 'ina')) {
              this.shapes.push(new Shapeshift(document.getElementsByClassName('shapeshift')[0], {
                anchors: 15,
                rings: 30,
                minRingScale: 0.25,
                length: 0.8,
                center: [0.55, 0.35],
                ringstyle: {
                  strokeColor: '#fff',
                  strokeWidth: 1,
                  dashArray: [1, 2],
                  strokeCap: 'round'
                }
              }));
            } else {
              this.shapes = [].map.call(document.getElementsByClassName('shapeshift'), function (element) {
                return new Shapeshift(element, {
                  rings: 20,
                  anchors: 15,
                  length: 0.75,
                  minRingScale: 0.35
                });
              });
            }

            // render & animation ticker
            TweenMax.ticker.fps(60);
            TweenMax.ticker.addEventListener('tick', function () {
              _this.tick();
            });

            // resize
            window.addEventListener('resize', function () {
              _this.resize();
            }, false);
          }
        }, {
          key: 'tick',
          value: function tick() {
            this.update();
            this.draw();
          }
        }, {
          key: 'update',
          value: function update() {
            this.shapes.forEach(function (s) {
              return s.update();
            });
          }
        }, {
          key: 'draw',
          value: function draw() {
            this.shapes.forEach(function (s) {
              return s.draw();
            });
          }
        }, {
          key: 'resize',
          value: function resize() {
            this.shapes.forEach(function (s) {
              return s.resize();
            });
          }
        }]);

        return App;
      }();

      _export('app', app = new App());

      _export('app', app);
    }
  };
});
//# sourceMappingURL=app.bundle.js.map