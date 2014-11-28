/****************************************************************************
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011-2012 cocos2d-x.org
 Copyright (c) 2013-2014 Chukong Technologies Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

/** Default Action tag  默认的动作标签
 * @constant
 * @type {Number}
 * @default
 */
cc.ACTION_TAG_INVALID = -1;

/**
 * Base class for cc.Action objects.    - cc.Action是所有动作对象的基类
 * @class
 *
 * @extends cc.Class
 *
 * @property {cc.Node}  target          - The target will be set with the 'startWithTarget' method. When the 'stop' method is called, target will be set to nil.
                                        - 此参数会被startWithTarget方法用来设置成员变量target.当stop方法已经被调用,则此参数对象会被设置成null.
 * @property {cc.Node}  originalTarget  - The original target of the action.
                                        - 此参数设置动作的原始对象,即动作的发出者.
 * @property {Number}   tag             - The tag of the action, can be used to find the action.
                                        - 此参数设置动作的标签, 可以通过这个标签找到这个动作.
 */
cc.Action = cc.Class.extend(/** @lends cc.Action# */{
    //***********variables*************
    originalTarget:null,
    target:null,
    tag:cc.ACTION_TAG_INVALID,

    //**************Public Functions***********

    /**
     * Constructor function, override it to extend the construction behavior, remember to call "this._super()" in the extended "ctor" function.
     * 构造函数, 通过重载这个函数来实现拓展构建行为, 记得在拓展的ctor函数里调用this._super(),他会调用父类的构造函数
     */
    ctor:function () {
        this.originalTarget = null;
        this.target = null;
        this.tag = cc.ACTION_TAG_INVALID;
    },

    /**
     * to copy object with deep copy.
     * 用深拷贝复制一个对象
     *
     * @deprecated since v3.0 please use .clone
     * 在v3.0 以后的版本 请使用 .clone
     *
     * @return {cc.Action}
     */
    copy:function () {
        cc.log("copy is deprecated. Please use clone instead.");
        return this.clone();
    },

    /**
     * to copy object with deep copy.
     * returns a clone of action.
     * 深拷贝一个对象, 返回这个动作的副本
     *
     * @return {cc.Action}
     */
    clone:function () {
        var action = new cc.Action();
        action.originalTarget = null;
        action.target = null;
        action.tag = this.tag;
        return action;
    },

    /**
     * return true if the action has finished.
     * 当动作已经执行完毕的时候返回true
     *
     * @return {Boolean}
     */
    isDone:function () {
        return true;
    },

    /**
     * called before the action start. It will also set the target.
     * 在动作开始前调用此方法.
     * 仍然会设置这个对象.
     *
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this.originalTarget = target;
        this.target = target;
    },

    /**
     * called after the action has finished. It will set the 'target' to nil. <br />
     * IMPORTANT: You should never call "action stop" manually. Instead, use: "target.stopAction(action);"
     * 在动作执行完毕以后调用会将成员target设为null.
     * 重要提示:你绝不应当手动调用此函数,而应该使用 "target.stopAction(action);"来代替
     */
    stop:function () {
        this.target = null;
    },

    /**
     * called every frame with it's delta time. <br />
     * DON'T override unless you know what you are doing.
     * 此函数随着间隔时间每一帧都会被调用.
     * 不要重载此函数,除非你知道你在做什么.
     *
     * @param {Number} dt
     */
    step:function (dt) {
        cc.log("[Action step]. override me");
    },

    /**
     * Called once per frame. Time is the number of seconds of a frame interval.
     * 每一帧被调用. 时间单位是每一帧所持续的时间秒数.
     *
     * @param {Number}  dt
     */
    update:function (dt) {
        cc.log("[Action update]. override me");
    },

    /**
     * get the target.
     * 获得此动作的对象.
     *
     * @return {cc.Node}
     */
    getTarget:function () {
        return this.target;
    },

    /**
     * The action will modify the target properties.
     * 这个动作会修改对象的属性.
     *
     * @param {cc.Node} target
     */
    setTarget:function (target) {
        this.target = target;
    },

    /**
     * get the original target.
     * 获取原始的对象.
     *
     * @return {cc.Node}
     */
    getOriginalTarget:function () {
        return this.originalTarget;
    },

    /**
     * Set the original target, since target can be nil. <br/>
     * Is the target that were used to run the action.  <br/>
     * Unless you are doing something complex, like cc.ActionManager, you should NOT call this method. <br/>
     * The target is 'assigned', it is not 'retained'. <br/>
     * 设置原始对象, 此对象是被用来执行动作的对象. 这个对象可以为空.
     * 除非你正在实现向cc.ActionManager这样复杂的的动作,否则你不应使用这个方法.
     * 此对象是被'assigned'而不是被'retained'.
     *
     * @param {cc.Node} originalTarget
     */
    setOriginalTarget:function (originalTarget) {
        this.originalTarget = originalTarget;
    },

    /**
     * get tag number. 获取标签
     * @return {Number}
     */
    getTag:function () {
        return this.tag;
    },

    /**
     * set tag number. 设置标签数字
     * @param {Number} tag
     */
    setTag:function (tag) {
        this.tag = tag;
    },

    /**
     * Currently JavaScript Bindigns (JSB), in some cases, needs to use retain and release. This is a bug in JSB, <br/>
     * and the ugly workaround is to use retain/release. So, these 2 methods were added to be compatible with JSB. <br/>
     * This is a hack, and should be removed once JSB fixes the retain/release bug.
     * 当前的JavaScript Bindings在某些情况下需要使用retain(保留)和release(释放).这是JSB的BUG
     * 只能通过retain/release这种拙劣的方式解决,因此这两个方法和JSB一起被加入了进来.
     * 这是一种非常规手段,一旦修复JSB的这个bug,就会删除.
     */
    retain:function () {
    },

    /**
     * Currently JavaScript Bindigns (JSB), in some cases, needs to use retain and release. This is a bug in JSB, <br/>
     * and the ugly workaround is to use retain/release. So, these 2 methods were added to be compatible with JSB. <br/>
     * This is a hack, and should be removed once JSB fixes the retain/release bug.
     * 当前的JavaScript Bindings在某些情况下需要使用retain(保留)和release(释放).这是JSB的BUG
     * 只能通过retain/release这种拙劣的方式解决,因此这两个方法和JSB一起被加入了进来.
     * 这是一种非常规手段,一旦修复JSB的这个bug,就会删除.
     */
    release:function () {
    }
});

/**
 * Allocates and initializes the action. -分配和初始化这个动作
 *
 * @function cc.action
 * @static
 * @return {cc.Action}
 *
 * @example
 * // return {cc.Action}
 * var action = cc.action();
 */
cc.action = function () {
    return new cc.Action();
};

/**
 * Please use cc.action instead. <br/>
 * Allocates and initializes the action. 
 * 分配和初始化动作
 * 请使用cc.action代替此方法
 *
 * @deprecated since v3.0 please use cc.action() instead. -自v3.0版本以后请使用cc.action()代替此方法
 * @static
 * @returns {cc.Action}
 */
cc.Action.create = cc.action;


/**
 * Base class actions that do have a finite time duration. <br/>
 * Possible actions: <br/>
 * - An action with a duration of 0 seconds. <br/>
 * - An action with a duration of 35.5 seconds.
 * 具有一段时间的动作基类
 * 可能的动作:
 * -一个只持续0秒的动作
 * -一个持续35.5秒的动作
 *
 * Infinite time actions are valid
 * 无限时长也是有效的
 * @class
 * @extends cc.Action
 */
cc.FiniteTimeAction = cc.Action.extend(/** @lends cc.FiniteTimeAction# */{
    //! duration in seconds
    _duration:0,

    /**
     * Constructor function, override it to extend the construction behavior, remember to call "this._super()" in the extended "ctor" function.
     * 构造函数, 通过重载这个函数来实现拓展构建行为, 记得在拓展的ctor函数里调用this._super(),他会调用父类的构造函数
     */
    ctor:function () {
        cc.Action.prototype.ctor.call(this);
        this._duration = 0;
    },

    /**
     * get duration of the action. (seconds)
     * 获取动作持续时间(秒)
     *
     * @return {Number}
     */
    getDuration:function () {
        return this._duration * (this._times || 1);
    },

    /**
     * set duration of the action. (seconds)
     * 设置动作持续时间(秒)
     *
     * @param {Number} duration
     */
    setDuration:function (duration) {
        this._duration = duration;
    },

    /**
     * Returns a reversed action. <br />
     * For example: <br />
     * - The action will be x coordinates of 0 move to 100. <br />
     * - The reversed action will be x of 100 move to 0.
     * - Will be rewritten
     * 返回动作的逆动作
     * 例如:
     * 一个动作x坐标从0移动到100
     * 它的逆动作就会从100移动到0
     * 这个函数可以被改写
     *
     * @return {Null}
     */
    reverse:function () {
        cc.log("cocos2d: FiniteTimeAction#reverse: Implement me");
        return null;
    },

    /**
     * to copy object with deep copy.
     * returns a clone of action.
     * 深拷贝一个对象 返回一个动作的克隆
     *
     * @return {cc.FiniteTimeAction}
     */
    clone:function () {
        return new cc.FiniteTimeAction();
    }
});

/**
 * Changes the speed of an action, making it take longer (speed > 1)
 * or less (speed < 1) time. <br/>
 * Useful to simulate 'slow motion' or 'fast forward' effect.
 * 更改动作的速度,使它更长(速度大于1)或更少(速度小于1)
 * 这对模拟慢速或者快速向前效果非常有效
 *
 * @warning This action can't be Sequenceable because it is not an cc.IntervalAction 注意: 这个动作不能序列化因为它不是持续性动作
 * @class
 * @extends cc.Action
 * @param {cc.ActionInterval} action
 * @param {Number} speed
 */
cc.Speed = cc.Action.extend(/** @lends cc.Speed# */{
    _speed:0.0,
    _innerAction:null,

	/**
     * Constructor function, override it to extend the construction behavior, remember to call "this._super()" in the extended "ctor" function.
     * 构造函数, 通过重载这个函数来实现拓展构建行为, 记得在拓展的ctor函数里调用this._super(),他会调用父类的构造函数
     * 
	 * @param {cc.ActionInterval} action
	 * @param {Number} speed
	 */
    ctor:function (action, speed) {
        cc.Action.prototype.ctor.call(this);
        this._speed = 0;
        this._innerAction = null;

		action && this.initWithAction(action, speed);
    },

    /**
     * Gets the current running speed. <br />
     * Will get a percentage number, compared to the original speed.
     * 获取当前运行的速度
     * 返回的是一个和原速度相比的百分比
     *
     * @return {Number}
     */
    getSpeed:function () {
        return this._speed;
    },

    /**
     * alter the speed of the inner function in runtime.
     * 在运行时修改速度的内部功能
     *
     * @param {Number} speed
     */
    setSpeed:function (speed) {
        this._speed = speed;
    },

    /**
     * initializes the action.
     * 初始化动作
     *
     * @param {cc.ActionInterval} action
     * @param {Number} speed
     * @return {Boolean}
     */
    initWithAction:function (action, speed) {
        if(!action)
            throw "cc.Speed.initWithAction(): action must be non nil";

        this._innerAction = action;
        this._speed = speed;
        return true;
    },

    /**
     * to copy object with deep copy.
     * returns a clone of action.
     * 深拷贝一个对象,返回它的克隆
     * 
     * @returns {cc.Speed}
     */
    clone:function () {
        var action = new cc.Speed();
        action.initWithAction(this._innerAction.clone(), this._speed);
        return action;
    },

    /**
     * called before the action start. It will also set the target.
     * 在动作开始前调用.它仍然会设置这个对象.
     *
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        cc.Action.prototype.startWithTarget.call(this, target);
        this._innerAction.startWithTarget(target);
    },

    /**
     *  Stop the action. 停止动作
     */
    stop:function () {
        this._innerAction.stop();
        cc.Action.prototype.stop.call(this);
    },

    /**
     * called every frame with it's delta time. <br />
     * DON'T override unless you know what you are doing.
     * 随着时间此函数被每帧调用, 请不要重载此函数,除非你知道你正在做什么.
     *
     * @param {Number} dt
     */
    step:function (dt) {
        this._innerAction.step(dt * this._speed);
    },

    /**
     * return true if the action has finished.
     * 当动作执行完毕的时候返回TRUE.
     *
     * @return {Boolean}
     */
    isDone:function () {
        return this._innerAction.isDone();
    },

    /**
     * returns a reversed action. <br />
     * For example: <br />
     * - The action will be x coordinates of 0 move to 100. <br />
     * - The reversed action will be x of 100 move to 0.
     * - Will be rewritten
     *
     * 返回动作的逆动作
     * 例如:
     * 一个动作x坐标从0移动到100
     * 它的逆动作就会从100移动到0
     * 这个函数可以被改写
     * 
     * @return {cc.Speed}
     */
    reverse:function () {
        return new cc.Speed(this._innerAction.reverse(), this._speed);
    },

    /**
     * Set inner Action. 设置内部动作
     * @param {cc.ActionInterval} action
     */
    setInnerAction:function (action) {
        if (this._innerAction != action) {
            this._innerAction = action;
        }
    },

    /**
     * Get inner Action. 获取内部动作
     *
     * @return {cc.ActionInterval}
     */
    getInnerAction:function () {
        return this._innerAction;
    }
});

/**
 * creates the speed action. 创建一个speed动作
 *
 * @function cc.speed
 * @param {cc.ActionInterval} action
 * @param {Number} speed
 * @return {cc.Speed}
 */
cc.speed = function (action, speed) {
    return new cc.Speed(action, speed);
};

/**
 * Please use cc.speed instead.
 * creates the action.
 * 创建一个 cc.speed动作 请用cc.speed代替
 *
 * @param {cc.ActionInterval} action
 * @param {Number} speed
 * @return {cc.Speed}
 * @static
 * @deprecated since v3.0 please use cc.speed() instead. 在v3.0版本以后请使用cc.speed()代替
 */
cc.Speed.create = cc.speed;

/**
 * cc.Follow is an action that "follows" a node.
 * cc.Follow是一个"跟随"节点的动作
 *
 * @example
 * //example
 * //Instead of using cc.Camera as a "follower", use this action instead.
 * layer.runAction(cc.follow(hero));
 * 当使用cc.Camera来实现跟随效果的时候,可以使用此动作代替.
 *
 * @property {Number}  leftBoundary - world leftBoundary.  -世界左边界
 * @property {Number}  rightBoundary - world rightBoundary. -世界右边界
 * @property {Number}  topBoundary - world topBoundary.     -世界上边界
 * @property {Number}  bottomBoundary - world bottomBoundary. -世界下边界
 *
 * @param {cc.Node} followedNode
 * @param {cc.Rect} rect
 * @example
 * // creates the action with a set boundary     创建一个带边界的动作
 * var sprite = new cc.Sprite("spriteFileName");
 * var followAction = new cc.Follow(sprite, cc.rect(0, 0, s.width * 2 - 100, s.height));
 * this.runAction(followAction);
 * 
 *
 * // creates the action with no boundary set    创建一个无边界动作
 * var sprite = new cc.Sprite("spriteFileName");
 * var followAction = new cc.Follow(sprite);
 * this.runAction(followAction);
 *
 * @class
 * @extends cc.Action
 */
cc.Follow = cc.Action.extend(/** @lends cc.Follow# */{
    // node to follow   用来跟随的节点
    _followedNode:null,
    // whether camera should be limited to certain area   是否限制相机在特定区域
    _boundarySet:false,
    // if screen size is bigger than the boundary - update not needed    如果屏幕尺寸大于边界就无需更新
    _boundaryFullyCovered:false,
    // fast access to the screen dimensions   快速读取屏幕尺寸
    _halfScreenSize:null,
    _fullScreenSize:null,
    _worldRect:null,

    leftBoundary:0.0,
    rightBoundary:0.0,
    topBoundary:0.0,
    bottomBoundary:0.0,

	/**
     * Constructor function, override it to extend the construction behavior, remember to call "this._super()" in the extended "ctor" function. <br />
	 * creates the action with a set boundary. <br/>
	 * creates the action with no boundary set.
     * 构造函数, 通过重载这个函数来实现拓展构建行为, 记得在拓展的ctor函数里调用this._super(),他会调用父类的构造函数
     * 创建一个带边界的动作
     * 创建一个不带边界的动作
     * @param {cc.Node} followedNode
     * @param {cc.Rect} rect
	 */
    ctor:function (followedNode, rect) {
        cc.Action.prototype.ctor.call(this);
        this._followedNode = null;
        this._boundarySet = false;

        this._boundaryFullyCovered = false;
        this._halfScreenSize = null;
        this._fullScreenSize = null;

        this.leftBoundary = 0.0;
        this.rightBoundary = 0.0;
        this.topBoundary = 0.0;
        this.bottomBoundary = 0.0;
        this._worldRect = cc.rect(0, 0, 0, 0);

		if(followedNode)
			rect ? this.initWithTarget(followedNode, rect)
				 : this.initWithTarget(followedNode);
    },

    /**
     * to copy object with deep copy.
     * returns a clone of action.
     *  深拷贝对象,返回此动作的克隆
     * @return {cc.Follow}
     */
    clone:function () {
        var action = new cc.Follow();
        var locRect = this._worldRect;
        var rect = new cc.Rect(locRect.x, locRect.y, locRect.width, locRect.height);
        action.initWithTarget(this._followedNode, rect);
        return action;
    },

    /**
     * Get whether camera should be limited to certain area.
     * 获得是否应该限制相机在特定的区域.
     *
     * @return {Boolean}
     */
    isBoundarySet:function () {
        return this._boundarySet;
    },

    /**
     * alter behavior - turn on/off boundary.
     * 修改行为 - 开关边界
     *
     * @param {Boolean} value
     */
    setBoudarySet:function (value) {
        this._boundarySet = value;
    },

    /**
     * initializes the action with a set boundary.
     * 初始化一个带边界的动作.
     *
     * @param {cc.Node} followedNode
     * @param {cc.Rect} [rect=]
     * @return {Boolean}
     */
    initWithTarget:function (followedNode, rect) {
        if(!followedNode)
            throw "cc.Follow.initWithAction(): followedNode must be non nil";

        var _this = this;
        rect = rect || cc.rect(0, 0, 0, 0);
        _this._followedNode = followedNode;
        _this._worldRect = rect;

        _this._boundarySet = !cc._rectEqualToZero(rect);

        _this._boundaryFullyCovered = false;

        var winSize = cc.director.getWinSize();
        _this._fullScreenSize = cc.p(winSize.width, winSize.height);
        _this._halfScreenSize = cc.pMult(_this._fullScreenSize, 0.5);

        if (_this._boundarySet) {
            _this.leftBoundary = -((rect.x + rect.width) - _this._fullScreenSize.x);
            _this.rightBoundary = -rect.x;
            _this.topBoundary = -rect.y;
            _this.bottomBoundary = -((rect.y + rect.height) - _this._fullScreenSize.y);

            if (_this.rightBoundary < _this.leftBoundary) {
                // screen width is larger than world's boundary width
                //set both in the middle of the world
                _this.rightBoundary = _this.leftBoundary = (_this.leftBoundary + _this.rightBoundary) / 2;
            }
            if (_this.topBoundary < _this.bottomBoundary) {
                // screen width is larger than world's boundary width
                //set both in the middle of the world
                _this.topBoundary = _this.bottomBoundary = (_this.topBoundary + _this.bottomBoundary) / 2;
            }

            if ((_this.topBoundary == _this.bottomBoundary) && (_this.leftBoundary == _this.rightBoundary))
                _this._boundaryFullyCovered = true;
        }
        return true;
    },

    /**
     * called every frame with it's delta time. <br />
     * DON'T override unless you know what you are doing.
     * 随着时间每帧被调用, 不要重载此函数除非你知道在做什么.
     *
     * @param {Number} dt
     */
    step:function (dt) {
        var tempPosX = this._followedNode.x;
        var tempPosY = this._followedNode.y;
        tempPosX = this._halfScreenSize.x - tempPosX;
        tempPosY = this._halfScreenSize.y - tempPosY;

        if (this._boundarySet) {
            // whole map fits inside a single screen, no need to modify the position - unless map boundaries are increased
            if (this._boundaryFullyCovered)
                return;

	        this.target.setPosition(cc.clampf(tempPosX, this.leftBoundary, this.rightBoundary), cc.clampf(tempPosY, this.bottomBoundary, this.topBoundary));
        } else {
            this.target.setPosition(tempPosX, tempPosY);
        }
    },

    /**
     * Return true if the action has finished.
     * 如果动作结束会返回TRUE.
     *
     * @return {Boolean}
     */
    isDone:function () {
        return ( !this._followedNode.running );
    },

    /**
     * Stop the action. 停止动作
     */
    stop:function () {
        this.target = null;
        cc.Action.prototype.stop.call(this);
    }
});

/**
 * creates the action with a set boundary. <br/>
 * creates the action with no boundary set.
 * 创建一个带边界的动作
 * 创建一个无边界的动作
 *
 * @function
 * @param {cc.Node} followedNode
 * @param {cc.Rect} rect
 * @return {cc.Follow|Null} returns the cc.Follow object on success  如果成功就返回cc.Follow对象
 * @example
 * // example
 * // creates the action with a set boundary   创建一个带边界动作
 * var sprite = new cc.Sprite("spriteFileName");
 * var followAction = cc.follow(sprite, cc.rect(0, 0, s.width * 2 - 100, s.height));
 * this.runAction(followAction);
 *
 * // creates the action with no boundary set   创建一个无边界动作
 * var sprite = new cc.Sprite("spriteFileName");
 * var followAction = cc.follow(sprite);
 * this.runAction(followAction);
 */
cc.follow = function (followedNode, rect) {
    return new cc.Follow(followedNode, rect);
};

/**
 * Please use cc.follow instead.            请使用cc.follow代替
 * creates the action with a set boundary. <br/>
 * creates the action with no boundary set.
 * @param {cc.Node} followedNode
 * @param {cc.Rect} rect
 * @return {cc.Follow|Null} returns the cc.Follow object on success 如果创建成功就返回cc.Follow对象
 * @static
 * @deprecated since v3.0 please cc.follow() instead.   在3.0版本之后请使用cc.follow()代替.
 */
cc.Follow.create = cc.follow;
