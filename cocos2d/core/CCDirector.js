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

cc.g_NumberOfDraws = 0;

cc.GLToClipTransform = function (transformOut) {
    var projection = new cc.kmMat4();
    cc.kmGLGetMatrix(cc.KM_GL_PROJECTION, projection);

    var modelview = new cc.kmMat4();
    cc.kmGLGetMatrix(cc.KM_GL_MODELVIEW, modelview);

    cc.kmMat4Multiply(transformOut, projection, modelview);
};
//----------------------------------------------------------------------------------------------------------------------

/**
 * <p>
 *    ATTENTION: USE cc.director INSTEAD OF cc.Director.<br/>                                               注意：使用cc.director而不是cc.Director
 *    cc.director is a singleton object which manage your game's logic flow.<br/>                           cc.director 是管理游戏逻辑流程的单例类
 *    Since the cc.director is a singleton, you don't need to call any constructor or create functions,<br/> 由于他是一个单例类，所以你不用调用任何构造方法或者create方法
 *    the standard way to use it is by calling:<br/>                                                         标准的调用方法如下：
 *      - cc.director.methodName(); <br/>                                                                    cc.director.methodName();
 *
 *    It creates and handle the main Window and manages how and when to execute the Scenes.<br/>             他创建并控制主窗口并且管理什么时候怎么运行场景。
 *    <br/>
 *    The cc.director is also responsible for:<br/>                                                          cc.director 还负责以下内容：
 *      - initializing the OpenGL context<br/>                                                               - 初始化OpenGL上下文
 *      - setting the OpenGL pixel format (default on is RGB565)<br/>                                        - 设置OpenGL像素格式（默认为RGB565)
 *      - setting the OpenGL pixel format (default on is RGB565)<br/>
 *      - setting the OpenGL buffer depth (default one is 0-bit)<br/>                                        - 设置OpenGL缓冲深度（默认为1）
 *      - setting the projection (default one is 3D)<br/>                                                    - 设置投影（默认为1，代表3D）
 *      - setting the orientation (default one is Portrait)<br/>                                             - 设置方向（默认为1，代表竖屏）
 *      <br/>
 *    <br/>
 *    The cc.director also sets the default OpenGL context:<br/>                                             cc.director也设置默认OpenGL上下文：
 *      - GL_TEXTURE_2D is enabled<br/>                                                                      - 激活GL_TEXTURE_2D
 *      - GL_VERTEX_ARRAY is enabled<br/>                                                                    - 激活GL_VERTEX_ARRAY
 *      - GL_COLOR_ARRAY is enabled<br/>                                                                     - 激活GL_COLOR_ARRAY
 *      - GL_TEXTURE_COORD_ARRAY is enabled<br/>                                                             - 激活GL_TEXTURE_COORD_ARRAY
 * </p>
 * <p>
 *   cc.director also synchronizes timers with the refresh rate of the display.<br/>                         cc.director还与显示的刷新速率同步时间
 *   Features and Limitations:<br/>                                                                          特性和限制：
 *      - Scheduled timers & drawing are synchronizes with the refresh rate of the display<br/>              - 定时器时间和绘图要和显示的刷新率同步
 *      - Only supports animation intervals of 1/60 1/30 & 1/15<br/>                                         - 只支持动画间隔为1/60,1/30,1/15
 * </p>
 * @class
 * @name cc.Director
 */
cc.Director = cc.Class.extend(/** @lends cc.Director# */{
    //Variables
    _landscape: false,
    _nextDeltaTimeZero: false,
    _paused: false,
    _purgeDirectorInNextLoop: false,
    _sendCleanupToScene: false,
    _animationInterval: 0.0,
    _oldAnimationInterval: 0.0,
    _projection: 0,
    _accumDt: 0.0,
    _contentScaleFactor: 1.0,

    _displayStats: false,
    _deltaTime: 0.0,
    _frameRate: 0.0,

    _FPSLabel: null,
    _SPFLabel: null,
    _drawsLabel: null,

    _winSizeInPoints: null,

    _lastUpdate: null,
    _nextScene: null,
    _notificationNode: null,
    _openGLView: null,
    _scenesStack: null,
    _projectionDelegate: null,
    _runningScene: null,

    _frames: 0,
    _totalFrames: 0,
    _secondsPerFrame: 0,

    _dirtyRegion: null,

    _scheduler: null,
    _actionManager: null,
    _eventProjectionChanged: null,
    _eventAfterDraw: null,
    _eventAfterVisit: null,
    _eventAfterUpdate: null,

    ctor: function () {
        var self = this;
        self._lastUpdate = Date.now();
        cc.eventManager.addCustomListener(cc.game.EVENT_SHOW, function () {
            self._lastUpdate = Date.now();
        });
    },

    init: function () {
        // scenes           场景
        this._oldAnimationInterval = this._animationInterval = 1.0 / cc.defaultFPS;
        this._scenesStack = [];
        // Set default projection (3D)      设置默认投影（3D）
        this._projection = cc.Director.PROJECTION_DEFAULT;
        // projection delegate if "Custom" projection is used  如果用户使用自定义的投影，设置投影代理为空
        this._projectionDelegate = null;

        //FPS      每秒帧数
        this._accumDt = 0;
        this._frameRate = 0;
        this._displayStats = false;//can remove   可以删除
        this._totalFrames = this._frames = 0;
        this._lastUpdate = Date.now();

        //Paused?  暂停？
        this._paused = false;

        //purge?   清理？
        this._purgeDirectorInNextLoop = false;

        this._winSizeInPoints = cc.size(0, 0);

        this._openGLView = null;
        this._contentScaleFactor = 1.0;

        //scheduler   定时器
        this._scheduler = new cc.Scheduler();
        //action manager   动作管理器
        this._actionManager = cc.ActionManager ? new cc.ActionManager() : null;
        this._scheduler.scheduleUpdateForTarget(this._actionManager, cc.Scheduler.PRIORITY_SYSTEM, false);

        this._eventAfterDraw = new cc.EventCustom(cc.Director.EVENT_AFTER_DRAW);
        this._eventAfterDraw.setUserData(this);
        this._eventAfterVisit = new cc.EventCustom(cc.Director.EVENT_AFTER_VISIT);
        this._eventAfterVisit.setUserData(this);
        this._eventAfterUpdate = new cc.EventCustom(cc.Director.EVENT_AFTER_UPDATE);
        this._eventAfterUpdate.setUserData(this);
        this._eventProjectionChanged = new cc.EventCustom(cc.Director.EVENT_PROJECTION_CHANGED);
        this._eventProjectionChanged.setUserData(this);

        return true;
    },

    /**
     * calculates delta time since last time it was called        计算自从上次调用的时间增量
     */
    calculateDeltaTime: function () {
        var now = Date.now();

        // new delta time.                          新的时间增量
        if (this._nextDeltaTimeZero) {
            this._deltaTime = 0;
            this._nextDeltaTimeZero = false;
        } else {
            this._deltaTime = (now - this._lastUpdate) / 1000;
        }

        if ((cc.game.config[cc.game.CONFIG_KEY.debugMode] > 0) && (this._deltaTime > 0.2))
            this._deltaTime = 1 / 60.0;

        this._lastUpdate = now;
    },

    /**
     * Converts a view coordinate to an WebGL coordinate<br/>                                               把视图坐标转换为WebGL坐标
     * Useful to convert (multi) touches coordinates to the current layout (portrait or landscape)<br/>     转换触摸（多点）坐标为当前布局坐标（横屏或者竖屏）
     * Implementation can be found in CCDirectorWebGL                                                       实现类可以在CCDirectorWebGL找到
     * @function                            函数
     * @param {cc.Point} uiPoint            
     * @return {cc.Point}
     */
    convertToGL: null,

    /**
     * Converts an WebGL coordinate to a view coordinate<br/>                                               将WebGL坐标转换为视图坐标
     * Useful to convert node points to window points for calls such as glScissor<br/>                      可以很方便的将节点坐标转换为窗口坐标以便调用glScissor
     * Implementation can be found in CCDirectorWebGL                                                       实现类可以在CCDirectorWebGL找到
     * @function
     * @param {cc.Point} glPoint
     * @return {cc.Point}
     */
    convertToUI: null,

    /**
     *  Draw the scene. This method is called every frame. Don't call it manually.                          绘制场景。每帧都会调用这个方法，不要手动调用。
     */
    drawScene: function () {
        var renderer = cc.renderer;
        // calculate "global" dt     计算全局时间增量
        this.calculateDeltaTime();

        //tick before glClear: issue #533
        if (!this._paused) {
            this._scheduler.update(this._deltaTime);
            cc.eventManager.dispatchEvent(this._eventAfterUpdate);
        }

        this._clear();

        /* to avoid flickr, nextScene MUST be here: after tick and before draw.                             为防止闪烁，下个场景必须在这里设置，在tick之后，绘制之前
         XXX: Which bug is this one. It seems that it can't be reproduced with v0.9                         XXX:这是哪个bug？看来在0.9版本中不能解决了
         */ 
        if (this._nextScene) {
            this.setNextScene();
        }

        if (this._beforeVisitScene)
            this._beforeVisitScene();

        // draw the scene                   绘制场景
        if (this._runningScene) {
            if (renderer.childrenOrderDirty === true) {
                cc.renderer.clearRenderCommands();
                this._runningScene._curLevel = 0;                          //level start from 0;   从0层开始
                this._runningScene.visit();
                renderer.resetFlag();
            } else if (renderer.transformDirty() === true)
                renderer.transform();

            cc.eventManager.dispatchEvent(this._eventAfterVisit);
        }

        // draw the notifications node                  绘制通知节点
        if (this._notificationNode)
            this._notificationNode.visit();

        if (this._displayStats)
            this._showStats();

        if (this._afterVisitScene)
            this._afterVisitScene();

        renderer.rendering(cc._renderContext);
        cc.eventManager.dispatchEvent(this._eventAfterDraw);
        this._totalFrames++;

        if (this._displayStats)
            this._calculateMPF();
    },

    _beforeVisitScene: null,
    _afterVisitScene: null,

    /**
     * End the life of director in the next frame                               下一帧停止导演类
     */
    end: function () {
        this._purgeDirectorInNextLoop = true;
    },

    /**
     * Returns the size in pixels of the surface. It could be different than the screen size.<br/>          返回表面的像素大小。他有可能和屏幕的大小不同
     * High-res devices might have a higher surface size than the screen size.                              高分辨率的设备平面像素大小可能比屏幕大小要大。
     * @return {Number}
     */
    getContentScaleFactor: function () {
        return this._contentScaleFactor;
    },

    /**
     * This object will be visited after the main scene is visited.<br/>                                    在主场景被访问之后，这个对象才会被访问
     * This object MUST implement the "visit" selector.<br/>                                                这个对象必须实现“访问者”的选择器
     * Useful to hook a notification object                                                                 可以很方便的获得提示对象                              
     * @return {cc.Node}
     */
    getNotificationNode: function () {
        return this._notificationNode;
    },

    /**
     * Returns the size of the WebGL view in points.<br/>                                                   返回WebGL视图的点大小
     * It takes into account any possible rotation (device orientation) of the Window                       他会考虑窗口任何形式的旋转（设备横竖方向）
     * @return {cc.Size}
     */
    getWinSize: function () {
        return cc.size(this._winSizeInPoints);
    },

    /**
     * Returns the size of the OpenGL view in pixels.<br/>                                                  返回WebGL视图的像素大小             
     * It takes into account any possible rotation (device orientation) of the window.<br/>                 他会考虑窗口任何形式的旋转（设备横竖方向）
     * On Mac winSize and winSizeInPixels return the same value.                                            在苹果系统下winSize和winSizeInPixels返回相同值
     * @return {cc.Size}
     */
    getWinSizeInPixels: function () {
        return cc.size(this._winSizeInPoints.width * this._contentScaleFactor, this._winSizeInPoints.height * this._contentScaleFactor);
    },

    /**
     * getVisibleSize/getVisibleOrigin move to CCDirectorWebGL/CCDirectorCanvas                             getVisibleSize/getVisibleOrigin 被转移到了 CCDirectorWebGL/CCDirectorCanvas                              
     * getZEye move to CCDirectorWebGL                                                                      getZEye 转移到了 CCDirectorWebGL
     */

    /**
     * Returns the visible size of the running scene                                                        返回正在运行场景的可视大小
     * @function
     * @return {cc.Size}
     */
    getVisibleSize: null,

    /**
     * Returns the visible origin of the running scene                                                     返回正在运行场景的原始可视大小 
     * @function
     * @return {cc.Point}
     */
    getVisibleOrigin: null,

    /**
     * Returns the z eye, only available in WebGL mode                                                     返回视角z值，只在WebGL模式下有效
     * @function
     * @return {Number}
     */
    getZEye: null,

    /**
     * Pause the director's ticker                                                                          暂停导演类的计算器
     */
    pause: function () {
        if (this._paused)
            return;

        this._oldAnimationInterval = this._animationInterval;
        // when paused, don't consume CPU                           暂停的时候，不消耗CPU
        this.setAnimationInterval(1 / 4.0);
        this._paused = true;
    },

    /**
     * Pops out a scene from the queue.<br/>                                                                            从队列（ps:我感觉应该是从栈里弹出）里弹出一个场景
     * This scene will replace the running one.<br/>                                                                    弹出的场景将替换当前正在运行的场景
     * The running scene will be deleted. If there are no more scenes in the stack the execution is terminated.<br/>    当前运行的场景将被删除掉，如果当前栈里没有场景了，就结束游戏执行
     * ONLY call it if there is a running scene.                                                                        只有在当前有运行场景的时候才调用这个方法
     */
    popScene: function () {

        cc.assert(this._runningScene, cc._LogInfos.Director_popScene);

        this._scenesStack.pop();
        var c = this._scenesStack.length;

        if (c == 0)
            this.end();
        else {
            this._sendCleanupToScene = true;
            this._nextScene = this._scenesStack[c - 1];
        }
    },

    /**
     * Removes cached all cocos2d cached data. It will purge the cc.textureCache, cc.spriteFrameCache, cc.animationCache    删除所有缓存的cocos2d缓存数据，将删除cc.textureCache, cc.spriteFrameCache, cc.animationCache 
     */
    purgeCachedData: function () {
        cc.animationCache._clear();
        cc.spriteFrameCache._clear();
        cc.textureCache._clear();
    },

    /**
     * Purge the cc.director itself, including unschedule all schedule, remove all event listeners, clean up and exit the running scene, stops all animations, clear cached data.
     * 删除cc.director自己，包括删除所有定时器，所有事件监听器，退出并删除正在运行的场景，停止所有的动画，删除所有缓存数据
     */
    purgeDirector: function () {
        //cleanup scheduler                                     删除定时器
        this.getScheduler().unscheduleAllCallbacks();

        // Disable event dispatching                            停止事件分发
        if (cc.eventManager)
            cc.eventManager.setEnabled(false);

        // don't release the event handlers                      不释放事件处理器
        // They are needed in case the director is run again     以便导演类再次运行的时候使用

        if (this._runningScene) {
            this._runningScene.onExitTransitionDidStart();
            this._runningScene.onExit();
            this._runningScene.cleanup();
        }

        this._runningScene = null;
        this._nextScene = null;

        // remove all objects, but don't release it.                    删除所有对象，但不释放他们
        // runScene might be executed after 'end'.                      runScene有可能在end方法之后执行
        this._scenesStack.length = 0;

        this.stopAnimation();

        // Clear all caches                                             删除所有缓存
        this.purgeCachedData();

        cc.checkGLErrorDebug();
    },

    /**
     * Suspends the execution of the running scene, pushing it on the stack of suspended scenes.<br/>   暂停当前正在执行的场景，并把他加到一个装有暂停场景的栈里 
     * The new scene will be executed.<br/>											新的场景将被执行
     * Try to avoid big stacks of pushed scenes to reduce memory allocation.<br/>	尽量避免更大存放场景的栈以便减少内存分配
     * ONLY call it if there is a running scene.									只有在有场景运行的时候才调用这个方法
     * @param {cc.Scene} scene
     */
    pushScene: function (scene) {

        cc.assert(scene, cc._LogInfos.Director_pushScene);

        this._sendCleanupToScene = false;

        this._scenesStack.push(scene);
        this._nextScene = scene;
    },

    /**
     * Run a scene. Replaces the running scene with a new one or enter the first scene.   运行一个场景。用一个新的场景来替换当前正在运行的场景或运行第一个场景
     * @param {cc.Scene} scene
     */
    runScene: function (scene) {

        cc.assert(scene, cc._LogInfos.Director_pushScene);

        if (!this._runningScene) {
            //start scene  					运行场景
            this.pushScene(scene);
            this.startAnimation();
        } else {
            //replace scene 				替换场景
            var i = this._scenesStack.length;
            if (i === 0) {
                this._sendCleanupToScene = true;
                this._scenesStack[i] = scene;
                this._nextScene = scene;
            } else {
                this._sendCleanupToScene = true;
                this._scenesStack[i - 1] = scene;
                this._nextScene = scene;
            }
        }
    },

    /**
     * Resume director after pause, if the current scene is not paused, nothing will happen.   从暂停中恢复导演类，如果当前场景没有被暂停，那么什么事都不做
     */
    resume: function () {
        if (!this._paused) {
            return;
        }

        this.setAnimationInterval(this._oldAnimationInterval);
        this._lastUpdate = Date.now();
        if (!this._lastUpdate) {
            cc.log(cc._LogInfos.Director_resume);
        }

        this._paused = false;
        this._deltaTime = 0;
    },

    /**
     * The size in pixels of the surface. It could be different than the screen size.<br/>  		表面的像素大小。他可能会跟屏幕大小不同
     * High-res devices might have a higher surface size than the screen size.						高分辨率的设备的表面尺寸可能要比屏幕尺寸大
     * @param {Number} scaleFactor   
     */
    setContentScaleFactor: function (scaleFactor) {
        if (scaleFactor != this._contentScaleFactor) {
            this._contentScaleFactor = scaleFactor;
            this._createStatsLabel();
        }
    },

    /**
     * Enables or disables WebGL depth test.<br/> 									激活或关闭WebGL深度测试
     * Implementation can be found in CCDirectorCanvas.js/CCDirectorWebGL.js 		他的实现类可以在CCDirectorCanvas.js/CCDirectorWebGL.js中找到
     * @function
     * @param {Boolean} on
     */
    setDepthTest: null,

    /**
     * Sets the default values based on the CCConfiguration info 					根据CCConfiguration的信息设置默认值
     */
    setDefaultValues: function () {

    },

    /**
     * Sets whether next delta time equals to zero   			设置下个事件增量为0
     * @param {Boolean} nextDeltaTimeZero
     */
    setNextDeltaTimeZero: function (nextDeltaTimeZero) {
        this._nextDeltaTimeZero = nextDeltaTimeZero;
    },

    /**
     * Starts the registered next scene 					开始运行下个注册的场景
     */
    setNextScene: function () {
        var runningIsTransition = false, newIsTransition = false;
        if (cc.TransitionScene) {
            runningIsTransition = this._runningScene ? this._runningScene instanceof cc.TransitionScene : false;
            newIsTransition = this._nextScene ? this._nextScene instanceof cc.TransitionScene : false;
        }

        // If it is not a transition, call onExit/cleanup     如果它不是一个过渡场景，就调用onExit或者cleanup方法
        if (!newIsTransition) {
            var locRunningScene = this._runningScene;
            if (locRunningScene) {
                locRunningScene.onExitTransitionDidStart();
                locRunningScene.onExit();
            }

            // issue #709. the root node (scene) should receive the cleanup message too  问题#709。根节点（场景）也必须接收到清理信息
            // otherwise it might be leaked.    				否则有可能造成泄漏
            if (this._sendCleanupToScene && locRunningScene)
                locRunningScene.cleanup();
        }

        this._runningScene = this._nextScene;
        cc.renderer.childrenOrderDirty = true;

        this._nextScene = null;
        if ((!runningIsTransition) && (this._runningScene != null)) {
            this._runningScene.onEnter();
            this._runningScene.onEnterTransitionDidFinish();
        }
    },

    /**
     * Sets Notification Node  					设置通知节点
     * @param {cc.Node} node
     */
    setNotificationNode: function (node) {
        this._notificationNode = node;
    },

    /**
     * Returns the cc.director delegate. 					返回cc.director代表
     * @return {cc.DirectorDelegate}
     */
    getDelegate: function () {
        return this._projectionDelegate;
    },

    /**
     * Sets the cc.director delegate. It shall implement the CCDirectorDelegate protocol  设置cc.director代表。它必须实现CCDirectorDelegate协议
     * @return {cc.DirectorDelegate}
     */
    setDelegate: function (delegate) {
        this._projectionDelegate = delegate;
    },

    /**
     * Sets the view, where everything is rendered, do not call this function.<br/>     设置所有东西都被渲染到的视图，不要调用这个函数
     * Implementation can be found in CCDirectorCanvas.js/CCDirectorWebGL.js.  			他的实现可以在CCDirectorCanvas.js/CCDirectorWebGL.js中找到
     * @function
     * @param {cc.view} openGLView
     */
    setOpenGLView: null,

    /**
     * Sets an OpenGL projection.<br/>								设置OpenGL投影
     * Implementation can be found in CCDiretorCanvas.js/CCDiretorWebGL.js. 			他的实现可以在CCDirectorCanvas.js/CCDirectorWebGL.js中找到
     * @function
     * @param {Number} projection
     */
    setProjection: null,

    /**
     * Update the view port.<br/>												更新视图端口
     * Implementation can be found in CCDiretorCanvas.js/CCDiretorWebGL.js.		他的实现可以在CCDirectorCanvas.js/CCDirectorWebGL.js中找到	
     * @function
     */
    setViewport: null,

    /**
     * Get the CCEGLView, where everything is rendered.<br/> 						获得CCEGLView,所有东西都会渲染到它上面
     * Implementation can be found in CCDiretorCanvas.js/CCDiretorWebGL.js.			他的实现可以在CCDirectorCanvas.js/CCDirectorWebGL.js中找到
     * @function
     * @return {cc.view}
     */
    getOpenGLView: null,

    /**
     * Sets an OpenGL projection.<br/>													设置OpenGL投影										
     * Implementation can be found in CCDiretorCanvas.js/CCDiretorWebGL.js.				他的实现可以在CCDirectorCanvas.js/CCDirectorWebGL.js中找到
     * @function
     * @return {Number}
     */
    getProjection: null,

    /**
     * Enables/disables OpenGL alpha blending.<br/> 							激活或关闭OpenGL α混合
     * Implementation can be found in CCDiretorCanvas.js/CCDiretorWebGL.js.		他的实现可以在CCDirectorCanvas.js/CCDirectorWebGL.js中找到
     * @function
     * @param {Boolean} on
     */
    setAlphaBlending: null,

    _showStats: function () {
        this._frames++;
        this._accumDt += this._deltaTime;
        if (this._FPSLabel && this._SPFLabel && this._drawsLabel) {
            if (this._accumDt > cc.DIRECTOR_FPS_INTERVAL) {
                this._SPFLabel.string = this._secondsPerFrame.toFixed(3);

                this._frameRate = this._frames / this._accumDt;
                this._frames = 0;
                this._accumDt = 0;

                this._FPSLabel.string = this._frameRate.toFixed(1);
                this._drawsLabel.string = (0 | cc.g_NumberOfDraws).toString();
            }
            this._FPSLabel.visit();
            this._SPFLabel.visit();
            this._drawsLabel.visit();
        } else
            this._createStatsLabel();
        cc.g_NumberOfDraws = 0;
    },

    /**
     * Returns whether or not the replaced scene will receive the cleanup message.<br>				返回替换场景是否能接收到清理消息
     * If the new scene is pushed, then the old scene won't receive the "cleanup" message.<br/> 	如果新的场景被添加进来，老的场景将不能接收到清理消息
     * If the new scene replaces the old one, the it will receive the "cleanup" message. 	如果新的场景替换了老的场景，那么新的场景将能接收到清理消息
     * @return {Boolean}
     */
    isSendCleanupToScene: function () {
        return this._sendCleanupToScene;
    },

    /**
     * Returns current running Scene. Director can only run one Scene at the time 		返回当前正在运行的场景。导演类同一时间只能运行一个场景。
     * @return {cc.Scene}
     */
    getRunningScene: function () {
        return this._runningScene;
    },

    /**
     * Returns the FPS value 				返回帧每秒的值
     * @return {Number}
     */
    getAnimationInterval: function () {
        return this._animationInterval;
    },

    /**
     * Returns whether or not to display the FPS informations 返回是否显示帧每秒信息
     * @return {Boolean}
     */
    isDisplayStats: function () {
        return this._displayStats;
    },

    /**
     * Sets whether display the FPS on the bottom-left corner 	设置是否在左下角显示FPS
     * @param {Boolean} displayStats
     */
    setDisplayStats: function (displayStats) {
        this._displayStats = displayStats;
    },

    /**
     * Returns seconds per frame
     * @return {Number}
     */
    getSecondsPerFrame: function () {
        return this._secondsPerFrame;
    },

    /**
     * Returns whether next delta time equals to zero     返回下个时间增量是否为零
     * @return {Boolean}
     */
    isNextDeltaTimeZero: function () {
        return this._nextDeltaTimeZero;
    },

    /**
     * Returns whether or not the Director is paused       返回导演类是否在暂停状态           
     * @return {Boolean}
     */
    isPaused: function () {
        return this._paused;
    },

    /**
     * Returns how many frames were called since the director started                       返回只从导演类启动后所有的帧数
     * @return {Number}
     */
    getTotalFrames: function () {
        return this._totalFrames;
    },

    /**
     * Pops out all scenes from the queue until the root scene in the queue. <br/>                      弹出所有场景直到根场景在队列里
     * This scene will replace the running one.  <br/>                                                  这个场景会替换掉正在运行的场景
     * Internally it will call "popToSceneStackLevel(1)"                                                内部他时调用popToSceneStackLevel(1)方法
     */
    popToRootScene: function () {
        this.popToSceneStackLevel(1);
    },

    /**
     * Pops out all scenes from the queue until it reaches "level".                             <br/>   弹出队列里所有的场景直到达到想要的层
     * If level is 0, it will end the director.                                                 <br/>   如果当前层是0，就停止导演类
     * If level is 1, it will pop all scenes until it reaches to root scene.                    <br/>   如果当前层是1，它会弹出所有所有场景直到达到最后一个场景
     * If level is <= than the current stack level, it won't do anything.                               如果当前层小于等于当前栈的层，不做任何事
     * @param {Number} level
     */
    popToSceneStackLevel: function (level) {

        cc.assert(this._runningScene, cc._LogInfos.Director_popToSceneStackLevel_2);

        var locScenesStack = this._scenesStack;
        var c = locScenesStack.length;

        if (c == 0) {
            this.end();
            return;
        }
        // current level or lower -> nothing                当前的层或者是空
        if (level > c)
            return;

        // pop stack until reaching desired level                           弹出栈直到达到想要的层
        while (c > level) {
            var current = locScenesStack.pop();
            if (current.running) {
                current.onExitTransitionDidStart();
                current.onExit();
            }
            current.cleanup();
            c--;
        }
        this._nextScene = locScenesStack[locScenesStack.length - 1];
        this._sendCleanupToScene = false;
    },

    /**
     * Returns the cc.Scheduler associated with this director          返回导演类里的cc.Scheduler
     * @return {cc.Scheduler}
     */
    getScheduler: function () {
        return this._scheduler;
    },

    /**
     * Sets the cc.Scheduler associated with this director             将cc.Scheduler设置到导演类上          
     * @param {cc.Scheduler} scheduler
     */
    setScheduler: function (scheduler) {
        if (this._scheduler != scheduler) {
            this._scheduler = scheduler;
        }
    },

    /**
     * Returns the cc.ActionManager associated with this director               返回导演类里的cc.ActionManager
     * @return {cc.ActionManager}
     */
    getActionManager: function () {
        return this._actionManager;
    },
    /**
     * Sets the cc.ActionManager associated with this director                  将cc.ActionManager设置到导演类上
     * @param {cc.ActionManager} actionManager
     */
    setActionManager: function (actionManager) {
        if (this._actionManager != actionManager) {
            this._actionManager = actionManager;
        }
    },

    /**
     * Returns the delta time since last frame                                          返回上一帧后的时间增量
     * @return {Number}
     */
    getDeltaTime: function () {
        return this._deltaTime;
    },

    _createStatsLabel: null,

    _calculateMPF: function () {
        var now = Date.now();
        this._secondsPerFrame = (now - this._lastUpdate) / 1000;
    }
});

/**
 * The event projection changed of cc.Director                                          cc.Director投影变化后的事件
 * @constant            常量
 * @type {string}
 * @example                                                                                用法：
 *   cc.eventManager.addCustomListener(cc.Director.EVENT_PROJECTION_CHANGED, function(event) {
 *           cc.log("Projection changed.");
 *       });
 */
cc.Director.EVENT_PROJECTION_CHANGED = "director_projection_changed";

/**
 * The event after draw of cc.Director                                                  绘制cc.Director后的事件
 * @constant            常量
 * @type {string}
 * @example                                                                                用法：
 *   cc.eventManager.addCustomListener(cc.Director.EVENT_AFTER_DRAW, function(event) {
 *           cc.log("after draw event.");
 *       });
 */
cc.Director.EVENT_AFTER_DRAW = "director_after_draw";

/**
 * The event after visit of cc.Director                                                     cc.Director访问后的事件
 * @constant                            常量
 * @type {string}
 * @example                                                                                 用法：
 *   cc.eventManager.addCustomListener(cc.Director.EVENT_AFTER_VISIT, function(event) {
 *           cc.log("after visit event.");
 *       });
 */
cc.Director.EVENT_AFTER_VISIT = "director_after_visit";

/**
 * The event after update of cc.Director                                                    cc.Director更新后的事件
 * @constant                            常量
 * @type {string}
 * @example                                                                                 例如：
 *   cc.eventManager.addCustomListener(cc.Director.EVENT_AFTER_UPDATE, function(event) {
 *           cc.log("after update event.");
 *       });
 */
cc.Director.EVENT_AFTER_UPDATE = "director_after_update";

/***************************************************
 * implementation of DisplayLinkDirector                            DisplayLinkDirector的实现类
 **************************************************/
cc.DisplayLinkDirector = cc.Director.extend(/** @lends cc.Director# */{
    invalid: false,

    /**
     * Starts Animation                                         开始动画
     */
    startAnimation: function () {
        this._nextDeltaTimeZero = true;
        this.invalid = false;
    },

    /**
     * Run main loop of director                            运行导演类的主循环
     */
    mainLoop: function () {
        if (this._purgeDirectorInNextLoop) {
            this._purgeDirectorInNextLoop = false;
            this.purgeDirector();
        }
        else if (!this.invalid) {
            this.drawScene();
        }
    },

    /**
     * Stops animation                                              停止动画
     */
    stopAnimation: function () {
        this.invalid = true;
    },

    /**
     * Sets animation interval                                      设置动画时间间隔
     * @param {Number} value the animation interval desired         想要设置的时间间隔的值
     */
    setAnimationInterval: function (value) {
        this._animationInterval = value;
        if (!this.invalid) {
            this.stopAnimation();
            this.startAnimation();
        }
    }
});

cc.Director.sharedDirector = null;
cc.Director.firstUseDirector = true;

cc.Director._getInstance = function () {
    if (cc.Director.firstUseDirector) {
        cc.Director.firstUseDirector = false;
        cc.Director.sharedDirector = new cc.DisplayLinkDirector();
        cc.Director.sharedDirector.init();
    }
    return cc.Director.sharedDirector;
};

/**
 * Default fps is 60
 * @type {Number}
 */
cc.defaultFPS = 60;

//Possible OpenGL projections used by director              director可能使用的投影
/**
 * Constant for 2D projection (orthogonal projection)           2D投影常量（正交投影）
 * @constant
 * @type {Number}
 */
cc.Director.PROJECTION_2D = 0;

/**
 * Constant for 3D projection with a fovy=60, znear=0.5f and zfar=1500.    3D投影常量，fovy=60，znear=0.5f,zfar=1500
 * @constant
 * @type {Number}
 */
cc.Director.PROJECTION_3D = 1;

/**
 * Constant for custom projection, if cc.Director's projection set to it, it calls "updateProjection" on the projection delegate.   自定义投影常量，如果想设置cc.Director的投影，可调用投影代理的updateProjection方法
 * @constant
 * @type {Number}
 */
cc.Director.PROJECTION_CUSTOM = 3;

/**
 * Constant for default projection of cc.Director, default projection is 3D projection          cc.Director的默认投影常量，默认为3D投影
 * @constant
 * @type {Number}
 */
cc.Director.PROJECTION_DEFAULT = cc.Director.PROJECTION_3D;

if (cc._renderType === cc._RENDER_TYPE_CANVAS) {

    var _p = cc.Director.prototype;

    _p.setProjection = function (projection) {
        this._projection = projection;
        cc.eventManager.dispatchEvent(this._eventProjectionChanged);
    };

    _p.setDepthTest = function () {
    };

    _p.setOpenGLView = function (openGLView) {
        // set size                 设置尺寸
        this._winSizeInPoints.width = cc._canvas.width;      //this._openGLView.getDesignResolutionSize();      获得设计的分辨率大小
        this._winSizeInPoints.height = cc._canvas.height;
        this._openGLView = openGLView || cc.view;
        if (cc.eventManager)
            cc.eventManager.setEnabled(true);
    };

    _p._clear = function () {
        var viewport = this._openGLView.getViewPortRect();
        cc._renderContext.clearRect(-viewport.x, viewport.y, viewport.width, -viewport.height);
    };


    _p._createStatsLabel = function () {
        var _t = this;
        var fontSize = 0;
        if (_t._winSizeInPoints.width > _t._winSizeInPoints.height)
            fontSize = 0 | (_t._winSizeInPoints.height / 320 * 24);
        else
            fontSize = 0 | (_t._winSizeInPoints.width / 320 * 24);

        _t._FPSLabel = new cc.LabelTTF("000.0", "Arial", fontSize);
        _t._SPFLabel = new cc.LabelTTF("0.000", "Arial", fontSize);
        _t._drawsLabel = new cc.LabelTTF("0000", "Arial", fontSize);

        var locStatsPosition = cc.DIRECTOR_STATS_POSITION;
        _t._drawsLabel.setPosition(_t._drawsLabel.width / 2 + locStatsPosition.x, _t._drawsLabel.height * 5 / 2 + locStatsPosition.y);
        _t._SPFLabel.setPosition(_t._SPFLabel.width / 2 + locStatsPosition.x, _t._SPFLabel.height * 3 / 2 + locStatsPosition.y);
        _t._FPSLabel.setPosition(_t._FPSLabel.width / 2 + locStatsPosition.x, _t._FPSLabel.height / 2 + locStatsPosition.y);
    };

    _p.getVisibleSize = function () {
        //if (this._openGLView) {                                        如果_openGLView不为空就返回他的可视大小
        //return this._openGLView.getVisibleSize();
        //} else {
        return this.getWinSize();
        //}
    };

    _p.getVisibleOrigin = function () {
        //if (this._openGLView) {                                       如果_openGLView不为空就返回他的原始可视大小
        //return this._openGLView.getVisibleOrigin();
        //} else {
        return cc.p(0, 0);
        //}
    };
} else {
    cc.Director._fpsImage = new Image();
    cc._addEventListener(cc.Director._fpsImage, "load", function () {
        cc.Director._fpsImageLoaded = true;
    });
    if (cc._fpsImage) {
        cc.Director._fpsImage.src = cc._fpsImage;
    }
    cc.assert(cc.isFunction(cc._tmp.DirectorWebGL), cc._LogInfos.MissingFile, "CCDirectorWebGL.js");
    cc._tmp.DirectorWebGL();
    delete cc._tmp.DirectorWebGL;
}