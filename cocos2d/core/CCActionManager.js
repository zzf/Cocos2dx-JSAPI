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

/**
 * @class
 * @extends cc.Class
 * @example
 * var element = new cc.HashElement();
 */
cc.HashElement = cc.Class.extend(/** @lends cc.HashElement# */{
    actions:null,
    target:null, //ccobject
    actionIndex:0,
    currentAction:null, //CCAction
    currentActionSalvaged:false,
    paused:false,
    hh:null, //ut hash handle
    /**
     * Constructor
     * 构造函数
     */
    ctor:function () {
        this.actions = [];
        this.target = null;
        this.actionIndex = 0;
        this.currentAction = null; //CCAction
        this.currentActionSalvaged = false;
        this.paused = false;
        this.hh = null; //ut hash handle
    }
});

/**
 * cc.ActionManager is a class that can manage actions.<br/>                                                cc.ActionManager是一个管理动作的类，
 * Normally you won't need to use this class directly. 99% of the cases you will use the CCNode interface,  通常你不需要直接使用这个类，99%的情况下你可以使用CCNode的接口
 * which uses this class's singleton object.                                                                而CCNode是一个单例
 * But there are some cases where you might need to use this class. <br/>                                   但是有些情况下需要你直接使用这个cc.ActionManager这个类         
 * Examples:<br/>                                                                                           比如，
 * - When you want to run an action where the target is different from a CCNode.<br/>                       -当你想在一个不是CCNode子类上运行动作时
 * - When you want to pause / resume the actions<br/>                                                       -当你想暂停、恢复动作时
 * @class
 * @extends cc.Class
 * @example
 * var mng = new cc.ActionManager();
 */
cc.ActionManager = cc.Class.extend(/** @lends cc.ActionManager# */{
    _hashTargets:null,
    _arrayTargets:null,
    _currentTarget:null,
    _currentTargetSalvaged:false,

    _searchElementByTarget:function (arr, target) {
        for (var k = 0; k < arr.length; k++) {
            if (target == arr[k].target)
                return arr[k];
        }
        return null;
    },

    ctor:function () {
        this._hashTargets = {};
        this._arrayTargets = [];
        this._currentTarget = null;
        this._currentTargetSalvaged = false;
    },

    /** Adds an action with a target.                                                             添加一个动作以及他的目标对象
     * If the target is already present, then the action will be added to the existing target.    如果这个目标对象已经存在，这个动作将会被添加到已存在的这个对象实例上
     * If the target is not present, a new instance of this target will be created either         如果目标对象不存在，将创建一个该对象新的实例（该实例的状态将依据第三个参数paused而定）
     * paused or not, and the action will be added to the newly created target.                   动作将会被添加到这个新的实例上
     * When the target is paused, the queued actions won't be 'ticked'.                           如果目标实例的状态是暂停（paused参数）， 那么该动作将不会被播放                     
     * @param {cc.Action} action    动作
     * @param {cc.Node} target      目标对象
     * @param {Boolean} paused      是否暂停
     */
    addAction:function (action, target, paused) {
        if(!action)
            throw "cc.ActionManager.addAction(): action must be non-null";
        if(!target)
            throw "cc.ActionManager.addAction(): action must be non-null";

        //check if the action target already exists   检查动作的目标对象实例是否已经存在
        var element = this._hashTargets[target.__instanceId];
        //if doesnt exists, create a hashelement and push in mpTargets     如果作的目标对象实例不存在，那么就创建一个新的并把他加到mpTargets里面
        if (!element) {
            element = new cc.HashElement();
            element.paused = paused;
            element.target = target;
            this._hashTargets[target.__instanceId] = element;
            this._arrayTargets.push(element);
        }
        //creates a array for that element to hold the actions     创建一个element数组来盛放所有动作
        this._actionAllocWithHashElement(element);

        element.actions.push(action);
        action.startWithTarget(target);
    },

    /**
     * Removes all actions from all the targets.  删除所有目标对象的所有动作
     */
    removeAllActions:function () {
        var locTargets = this._arrayTargets;
        for (var i = 0; i < locTargets.length; i++) {
            var element = locTargets[i];
            if (element)
                this.removeAllActionsFromTarget(element.target, true);
        }
    },
    /** Removes all actions from a certain target. <br/>             删除特定目标对象的所有动作
     * All the actions that belongs to the target will be removed.   目标对象的所有动作将会被删除
     * @param {object} target          目标对象
     * @param {boolean} forceDelete    是否强制删除
     */
    removeAllActionsFromTarget:function (target, forceDelete) {
        // explicit null handling
        if (target == null)
            return;
        var element = this._hashTargets[target.__instanceId];
        if (element) {
            if (element.actions.indexOf(element.currentAction) !== -1 && !(element.currentActionSalvaged))
                element.currentActionSalvaged = true;

            element.actions.length = 0;
            if (this._currentTarget == element && !forceDelete) {
                this._currentTargetSalvaged = true;
            } else {
                this._deleteHashElement(element);
            }
        }
    },
    /** Removes an action given an action reference.    删除一个动作（传入动作的引用）
     * @param {cc.Action} action   动作
     */
    removeAction:function (action) {
        // explicit null handling
        if (action == null)
            return;
        var target = action.getOriginalTarget();
        var element = this._hashTargets[target.__instanceId];

        if (element) {
            for (var i = 0; i < element.actions.length; i++) {
                if (element.actions[i] == action) {
                    element.actions.splice(i, 1);
                    break;
                }
            }
        } else {
            cc.log(cc._LogInfos.ActionManager_removeAction);
        }
    },

    /** Removes an action given its tag and the target  删除一个动作（传入动作的标签tag 以及该动作的目标对象）
     * @param {Number} tag      标签
     * @param {object} target   目标对象
     */
    removeActionByTag:function (tag, target) {
        if(tag == cc.ACTION_TAG_INVALID)
            cc.log(cc._LogInfos.ActionManager_addAction);

        cc.assert(target, cc._LogInfos.ActionManager_addAction);

        var element = this._hashTargets[target.__instanceId];

        if (element) {
            var limit = element.actions.length;
            for (var i = 0; i < limit; ++i) {
                var action = element.actions[i];
                if (action && action.getTag() === tag && action.getOriginalTarget() == target) {
                    this._removeActionAtIndex(i, element);
                    break;
                }
            }
        }
    },

    /** Gets an action given its tag an a target        获取一个动作（传入动作的标签tag 以及该动作的目标对象）
     * @param {Number} tag     标签
     * @param {object} target  目标对象
     * @return {cc.Action|Null}  return the Action with the given tag on success    如果找到动作则返回该动作
     */
    getActionByTag:function (tag, target) {
        if(tag == cc.ACTION_TAG_INVALID)
            cc.log(cc._LogInfos.ActionManager_getActionByTag);

        var element = this._hashTargets[target.__instanceId];
        if (element) {
            if (element.actions != null) {
                for (var i = 0; i < element.actions.length; ++i) {
                    var action = element.actions[i];
                    if (action && action.getTag() === tag)
                        return action;
                }
            }
            cc.log(cc._LogInfos.ActionManager_getActionByTag_2, tag);
        }
        return null;
    },


    /** Returns the numbers of actions that are running in a certain target. <br/>       放回目标对象上的动作个数
     * Composable actions are counted as 1 action. <br/>                                 组合在一起的多个动作算作一个动作
     * Example: <br/>                                                                    比如，
     * - If you are running 1 Sequence of 7 actions, it will return 1. <br/>             - 如果有一个连续动作包括七个子动作，算作一个动作
     * - If you are running 7 Sequences of 2 actions, it will return 7.                  - 如果有七个连续动作，每个连续动作包含两个子动作，那么算作七个动作
     * @param {object} target    目标对象
     * @return {Number}       动作个数
     */
    numberOfRunningActionsInTarget:function (target) {
        var element = this._hashTargets[target.__instanceId];
        if (element)
            return (element.actions) ? element.actions.length : 0;

        return 0;
    },
    /** Pauses the target: all running actions and newly added actions will be paused.   暂停目标对象：所有正在播放的或新添加的动作都将会被暂停
     * @param {object} target   目标对象
     */
    pauseTarget:function (target) {
        var element = this._hashTargets[target.__instanceId];
        if (element)
            element.paused = true;
    },
    /** Resumes the target. All queued actions will be resumed.     恢复目标对象,队列里所有的动作都将被恢复
     * @param {object} target
     */
    resumeTarget:function (target) {
        var element = this._hashTargets[target.__instanceId];
        if (element)
            element.paused = false;
    },

    /**
     * Pauses all running actions, returning a list of targets whose actions were paused.    暂停所有正在播放的动作，返回被暂停动作的目标对象的列表
     * @return {Array}  a list of targets whose actions were paused.                         被暂停动作的目标对象的列表
     */
    pauseAllRunningActions:function(){
        var idsWithActions = [];
        var locTargets = this._arrayTargets;
        for(var i = 0; i< locTargets.length; i++){
            var element = locTargets[i];
            if(element && !element.paused){
                element.paused = true;
                idsWithActions.push(element.target);
            }
        }
        return idsWithActions;
    },

    /**
     * Resume a set of targets (convenience function to reverse a pauseAllRunningActions call)   恢复集合里所有目标对象的动作，（这是一个很方便的方法来逆转pauseAllRunningActions方法（恢复所有在pauseAllRunningActions方法中暂停的方法））
     * @param {Array} targetsToResume    要恢复的目标对象数组
     */
    resumeTargets:function(targetsToResume){
        if(!targetsToResume)
            return;

        for(var i = 0 ; i< targetsToResume.length; i++){
            if(targetsToResume[i])
                this.resumeTarget(targetsToResume[i]);
        }
    },

    /** purges the shared action manager. It releases the retained instance. <br/>          清理共享的动作管理器，他会释放保留的实例
     * because it uses this, so it can not be static                                        这也是为什么他不能是静态的
     */
    purgeSharedManager:function () {
        cc.director.getScheduler().unscheduleUpdateForTarget(this);
    },

    //protected  保护类型函数
    _removeActionAtIndex:function (index, element) {
        var action = element.actions[index];

        if ((action == element.currentAction) && (!element.currentActionSalvaged))
            element.currentActionSalvaged = true;

        element.actions.splice(index, 1);

        // update actionIndex in case we are in tick. looping over the actions     更新actionIndex，以防动作在播放，循环完动作
        if (element.actionIndex >= index)
            element.actionIndex--;

        if (element.actions.length == 0) {
            if (this._currentTarget == element) {
                this._currentTargetSalvaged = true;
            } else {
                this._deleteHashElement(element);
            }
        }
    },

    _deleteHashElement:function (element) {
        if (element) {
            delete this._hashTargets[element.target.__instanceId];
            cc.arrayRemoveObject(this._arrayTargets, element);
            element.actions = null;
            element.target = null;
        }
    },

    _actionAllocWithHashElement:function (element) {
        // 4 actions per Node by default    默认情况下每个节点四个动作
        if (element.actions == null) {
            element.actions = [];
        }
    },

    /**
     * @param {Number} dt delta time in seconds     间隔时间（秒）
     */
    update:function (dt) {
        var locTargets = this._arrayTargets , locCurrTarget;
        for (var elt = 0; elt < locTargets.length; elt++) {
            this._currentTarget = locTargets[elt];
            locCurrTarget = this._currentTarget;
            //this._currentTargetSalvaged = false;
            if (!locCurrTarget.paused) {
                // The 'actions' CCMutableArray may change while inside this loop.  变量actions(CCMutableArray类型)在这个循环有可能会被改变
                for (locCurrTarget.actionIndex = 0; locCurrTarget.actionIndex < locCurrTarget.actions.length;
                     locCurrTarget.actionIndex++) {
                    locCurrTarget.currentAction = locCurrTarget.actions[locCurrTarget.actionIndex];
                    if (!locCurrTarget.currentAction)
                        continue;

                    locCurrTarget.currentActionSalvaged = false;
                    //use for speed     用于速度
                    locCurrTarget.currentAction.step(dt * ( locCurrTarget.currentAction._speedMethod ? locCurrTarget.currentAction._speed : 1 ) );
                    if (locCurrTarget.currentActionSalvaged) {
                        // The currentAction told the node to remove it. To prevent the action from      currentAction属性告诉节点来删除它。我们保留该动作，以防止在循环过程中
                        // accidentally deallocating itself before finishing its step, we retained       动作被意外的释放掉。现在循环结束了，可以释放它了。
                        // it. Now that step is done, it's safe to release it.
                        locCurrTarget.currentAction = null;//release   释放
                    } else if (locCurrTarget.currentAction.isDone()) {
                        locCurrTarget.currentAction.stop();
                        var action = locCurrTarget.currentAction;
                        // Make currentAction nil to prevent removeAction from salvaging it.      设置currentAction为nil以防止removeAction重用它
                        locCurrTarget.currentAction = null;
                        this.removeAction(action);
                    }

                    locCurrTarget.currentAction = null;
                }
            }

            // elt, at this moment, is still valid             此时变量elt依然有效   
            // so it is safe to ask this here (issue #490)     因此我们可以放心大胆的问这个问题了（问题 #490）

            // only delete currentTarget if no actions were scheduled during the cycle (issue #481)   在循环中如果没有动作被播放，只是删除currentTarget（当前目标对象）
            if (this._currentTargetSalvaged && locCurrTarget.actions.length === 0) {
                this._deleteHashElement(locCurrTarget);
            }
        }
    }
});
