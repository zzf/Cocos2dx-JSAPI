/****************************************************************************
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011-2012 cocos2d-x.org
 Copyright (c) 2013-2014 Chukong Technologies Inc.
 Copyright (c) 2008-2009 Jason Booth

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
 * cc.MotionStreak manages a Ribbon based on it's motion in absolute space.                 <br/>
 * You construct it with a fadeTime, minimum segment size, texture path, texture            <br/>
 * length and color. The fadeTime controls how long it takes each vertex in                 <br/>
 * the streak to fade out, the minimum segment size it how many pixels the                  <br/>
 * streak will move before adding a new ribbon segment, and the texture                     <br/>
 * length is the how many pixels the texture is stretched across. The texture               <br/>
 * is vertically aligned along the streak segment.
 * cc.MotionStream基于拖尾特效的绝对空间控制拖尾，
 * （在游戏的实现过程中，我们有时会需要在某个游戏对象上的运动轨迹上实现间隐效果，
 * 这种感觉就好像是类似飞机拉线似的拖尾巴，使我们的游戏在视觉上感觉很好，
 * 比如子弹的运动轨迹等等，在kjava时代，这种效果，往往需要美术通过大量的图片来实现
 * ，cocos2d-x提供了一种内置的间隐效果拖尾的实现方法CCMotionStreak），
 * 通过设置拖尾消失的时间，最小分割尺寸，纹理路径，纹理长度和颜色来构建这种特效，
 * 消失时间控制特效条纹从顶点淡出的时间，最小分割尺寸控制下一特效开始之前本次特效条纹所包含的像素点数，
 * 纹理长度控制条纹伸展的像素点数，纹理沿着条纹段垂直对齐
 * @class
 * @extends cc.Node
 *
 * @property {cc.Texture2D} texture                         - Texture used for the motion streak. 用于拖尾效果的纹理
 * @property {Boolean}      fastMode                        - Indicate whether use fast mode. 声明是否使用快速模式
 * @property {Boolean}      startingPositionInitialized     - Indicate whether starting position initialized. 声明是否重置开始位置
 * @example
 * //example
 * new cc.MotionStreak(2, 3, 32, cc.color.GREEN, s_streak);
 */
cc.MotionStreak = cc.Node.extend(/** @lends cc.MotionStreak# */{
    texture:null,
    fastMode:false,
    startingPositionInitialized:false,

    _blendFunc:null,

    _stroke:0,
    _fadeDelta:0,
    _minSeg:0,

    _maxPoints:0,
    _nuPoints:0,
    _previousNuPoints:0,

    /* Pointers */
    _pointVertexes:null,
    _pointState:null,

    // webgl
    _vertices:null,
    _colorPointer:null,
    _texCoords:null,

    _verticesBuffer:null,
    _colorPointerBuffer:null,
    _texCoordsBuffer:null,
    _className:"MotionStreak",

    /**
     * creates and initializes a motion streak with fade in seconds, minimum segments, stroke's width, color, texture filename or texture   <br/>
     * 设置参数：消失的时间(s)、最小分割尺寸、笔画宽度、颜色、纹理文件名或纹理来构建和初始化拖尾特效
     * Constructor of cc.MotionStreak cc.MotionStream 构造函数
     * @param {Number} fade time to fade
     * @param {Number} minSeg minimum segment size
     * @param {Number} stroke stroke's width
     * @param {Number} color
     * @param {string|cc.Texture2D} texture texture filename or texture
     */
    ctor: function (fade, minSeg, stroke, color, texture) {
        cc.Node.prototype.ctor.call(this);
        this._positionR = cc.p(0, 0);
        this._blendFunc = new cc.BlendFunc(cc.SRC_ALPHA, cc.ONE_MINUS_SRC_ALPHA);
        this._vertexWebGLBuffer = cc._renderContext.createBuffer();

        this.fastMode = false;
        this.startingPositionInitialized = false;

        this.texture = null;

        this._stroke = 0;
        this._fadeDelta = 0;
        this._minSeg = 0;

        this._maxPoints = 0;
        this._nuPoints = 0;
        this._previousNuPoints = 0;

        /** Pointers */
        this._pointVertexes = null;
        this._pointState = null;

        // webgl
        this._vertices = null;
        this._colorPointer = null;
        this._texCoords = null;

        this._verticesBuffer = null;
        this._colorPointerBuffer = null;
        this._texCoordsBuffer = null;

        if(texture !== undefined)
            this.initWithFade(fade, minSeg, stroke, color, texture);
    },

    _initRendererCmd:function(){
        this._rendererCmd = new cc.MotionStreakCmdWebGL(this);
    },

    /**
     * Gets the texture. 获得纹理
     * @return {cc.Texture2D}
     */
    getTexture:function () {
        return this.texture;
    },

    /**
     * Set the texture. 设置纹理
     * @param {cc.Texture2D} texture
     */
    setTexture:function (texture) {
        if (this.texture != texture)
            this.texture = texture;
    },

    /**
     * Gets the blend func. 混合功能
     * @return {cc.BlendFunc}
     */
    getBlendFunc:function () {
        return this._blendFunc;
    },

    /**
     * Set the blend func. 设置混合函数
     * @param {Number} src
     * @param {Number} dst
     */
    setBlendFunc:function (src, dst) {
        if (dst === undefined) {
            this._blendFunc = src;
        } else {
            this._blendFunc.src = src;
            this._blendFunc.dst = dst;
        }
    },

    /**
     * Gets opacity.获得透明度
     * @warning cc.MotionStreak.getOpacity has not been supported. @warning cc.MotionStreak.getOpacity 还不支持
     * @returns {number}
     */
    getOpacity:function () {
        cc.log("cc.MotionStreak.getOpacity has not been supported.");
        return 0;
    },

    /**
     * Set opacity. 设置透明度
     * @warning cc.MotionStreak.setOpacity has not been supported. @warning cc.MotionStreak.setOpacity 还不支持
     * @param opacity
     */
    setOpacity:function (opacity) {
        cc.log("cc.MotionStreak.setOpacity has not been supported.");
    },

    /**
     * set opacity modify RGB. 设置透明度修改RGB
     * @warning cc.MotionStreak.setOpacityModifyRGB has not been supported.  @warning cc.MotionStreak.setOpacityModifyRGB还不支持
     * @param value
     */
    setOpacityModifyRGB:function (value) {
    },

    /**
     * Checking OpacityModifyRGB. 检查修改RGB透明度
     * @returns {boolean}
     */
    isOpacityModifyRGB:function () {
        return false;
    },

    /**
     * <p>
     * callback that is called every time the node leaves the 'stage'.   每当节点离开画布使用此回调函数                                       <br/>
     * If the node leaves the 'stage' with a transition, this callback is called when the transition finishes. <br/>
     * 如果节点经转换离开画布，此回调函数在转换完成后调用
     * During onExit you can't access a sibling node.   onExit期间你不能访问兄弟节点                                                            <br/>
     * If you override onExit, you shall call its parent's onExit with this._super(). 如果重写onExit，可以通过this._super()调用父类的onExit
     * </p>
     * @function
     */
    onExit:function(){
        cc.Node.prototype.onExit.call(this);
        if(this._verticesBuffer)
            cc._renderContext.deleteBuffer(this._verticesBuffer);
        if(this._texCoordsBuffer)
            cc._renderContext.deleteBuffer(this._texCoordsBuffer);
        if(this._colorPointerBuffer)
            cc._renderContext.deleteBuffer(this._colorPointerBuffer);
    },

    /**
     * Checking fast mode.检查快速模式
     * @returns {boolean}
     */
    isFastMode:function () {
        return this.fastMode;
    },

    /**
     * set fast mode 设置快速模式
     * @param {Boolean} fastMode
     */
    setFastMode:function (fastMode) {
        this.fastMode = fastMode;
    },

    /**
     * Checking starting position initialized. 检查开始位置初始化
     * @returns {boolean}
     */
    isStartingPositionInitialized:function () {
        return this.startingPositionInitialized;
    },

    /**
     * Set Starting Position Initialized. 设置开始位置初始化
     * @param {Boolean} startingPositionInitialized
     */
    setStartingPositionInitialized:function (startingPositionInitialized) {
        this.startingPositionInitialized = startingPositionInitialized;
    },

    /**
     * initializes a motion streak with fade in seconds, minimum segments, stroke's width, color and texture filename or texture
     * 设置参数：消失的时间(s)、最小分割尺寸、笔画宽度、颜色、纹理文件名或纹理来初始化拖尾特效
     * @param {Number} fade time to fade
     * @param {Number} minSeg minimum segment size
     * @param {Number} stroke stroke's width
     * @param {Number} color
     * @param {string|cc.Texture2D} texture texture filename or texture
     * @return {Boolean}
     */
    initWithFade:function (fade, minSeg, stroke, color, texture) {
        if(!texture)
            throw "cc.MotionStreak.initWithFade(): Invalid filename or texture";

        if (cc.isString(texture))
            texture = cc.textureCache.addImage(texture);

        cc.Node.prototype.setPosition.call(this, cc.p(0,0));
        this.anchorX = 0;
        this.anchorY = 0;
        this.ignoreAnchor = true;
        this.startingPositionInitialized = false;

        this.fastMode = true;
        this._minSeg = (minSeg == -1.0) ? (stroke / 5.0) : minSeg;
        this._minSeg *= this._minSeg;

        this._stroke = stroke;
        this._fadeDelta = 1.0 / fade;

        var locMaxPoints = (0 | (fade * 60)) + 2;
        this._nuPoints = 0;
        this._pointState = new Float32Array(locMaxPoints);
        this._pointVertexes = new Float32Array(locMaxPoints * 2);

        this._vertices = new Float32Array(locMaxPoints * 4);
        this._texCoords = new Float32Array(locMaxPoints * 4);
        this._colorPointer = new Uint8Array(locMaxPoints * 8);
        this._maxPoints = locMaxPoints;

        var gl = cc._renderContext;

        this._verticesBuffer = gl.createBuffer();
        this._texCoordsBuffer = gl.createBuffer();
        this._colorPointerBuffer = gl.createBuffer();

        // Set blend mode 设置混合模式
        this._blendFunc.src = gl.SRC_ALPHA;
        this._blendFunc.dst = gl.ONE_MINUS_SRC_ALPHA;

        // shader program 着色器程序
        this.shaderProgram = cc.shaderCache.programForKey(cc.SHADER_POSITION_TEXTURECOLOR);

        this.texture = texture;
        this.color = color;
        this.scheduleUpdate();

        //bind buffer  绑定缓冲
        gl.bindBuffer(gl.ARRAY_BUFFER, this._verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._texCoords, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorPointerBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._colorPointer, gl.DYNAMIC_DRAW);

        return true;
    },

    /**
     * color used for the tint 用于染色的颜色
     * @param {cc.Color} color
     */
    tintWithColor:function (color) {
        this.color = color;

        // Fast assignation 快速指定
        var locColorPointer = this._colorPointer;
        for (var i = 0, len = this._nuPoints * 2; i < len; i++) {
            locColorPointer[i * 4] = color.r;
            locColorPointer[i * 4 + 1] = color.g;
            locColorPointer[i * 4 + 2] = color.b;
        }
    },

    /**
     * Remove all living segments of the ribbon 删除拖尾当前所有片段
     */
    reset:function () {
        this._nuPoints = 0;
    },

    /**
     * Set the position. 设置位置 <br />
     *
     * @param {cc.Point|Number} position
     * @param {Number} [yValue=undefined] If not exists, the first parameter must be cc.Point.
     */
    setPosition:function (position, yValue) {
        this.startingPositionInitialized = true;
        if(yValue === undefined){
            this._positionR.x = position.x;
            this._positionR.y = position.y;
        } else {
            this._positionR.x = position;
            this._positionR.y = yValue;
        }
    },

    /**
     * Gets the position.x 获得.x位置
     * @return {Number}
     */
    getPositionX:function () {
        return this._positionR.x;
    },

    /**
     * Set the position.x 设置.x位置
     * @param {Number} x
     */
    setPositionX:function (x) {
        this._positionR.x = x;
        if(!this.startingPositionInitialized)
            this.startingPositionInitialized = true;
    },

    /**
     * Gets the position.y 获得.y位置
     * @return {Number}
     */
    getPositionY:function () {
        return  this._positionR.y;
    },

    /**
     * Set the position.y 设置.y位置
     * @param {Number} y
     */
    setPositionY:function (y) {
        this._positionR.y = y;
        if(!this.startingPositionInitialized)
            this.startingPositionInitialized = true;
    },

    /**
     * Render function using the canvas 2d context or WebGL context, internal usage only, please do not call this function
     * 着色功能使用画布2d环境或WebGL环境，仅内部用法，不用调用
     * @function
     * @param {CanvasRenderingContext2D | WebGLRenderingContext} ctx The render context
     */
    draw:function (ctx) {
        if (this._nuPoints <= 1)
            return;

        if(this.texture && this.texture.isLoaded()){
            ctx = ctx || cc._renderContext;
            cc.nodeDrawSetup(this);
            cc.glEnableVertexAttribs(cc.VERTEX_ATTRIB_FLAG_POS_COLOR_TEX);
            cc.glBlendFunc(this._blendFunc.src, this._blendFunc.dst);

            cc.glBindTexture2D(this.texture);

            //position 位置
            ctx.bindBuffer(ctx.ARRAY_BUFFER, this._verticesBuffer);
            ctx.bufferData(ctx.ARRAY_BUFFER, this._vertices, ctx.DYNAMIC_DRAW);
            ctx.vertexAttribPointer(cc.VERTEX_ATTRIB_POSITION, 2, ctx.FLOAT, false, 0, 0);

            //texcoords 当图片长宽比不适合给定范围长宽比的时候如何伸缩图像
            ctx.bindBuffer(ctx.ARRAY_BUFFER, this._texCoordsBuffer);
            ctx.bufferData(ctx.ARRAY_BUFFER, this._texCoords, ctx.DYNAMIC_DRAW);
            ctx.vertexAttribPointer(cc.VERTEX_ATTRIB_TEX_COORDS, 2, ctx.FLOAT, false, 0, 0);

            //colors  颜色
            ctx.bindBuffer(ctx.ARRAY_BUFFER, this._colorPointerBuffer);
            ctx.bufferData(ctx.ARRAY_BUFFER, this._colorPointer, ctx.DYNAMIC_DRAW);
            ctx.vertexAttribPointer(cc.VERTEX_ATTRIB_COLOR, 4, ctx.UNSIGNED_BYTE, true, 0, 0);

            ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, this._nuPoints * 2);
            cc.g_NumberOfDraws ++;
        }
    },

    /**
     * <p>schedules the "update" method.    更新方法安排                                                                       <br/>
     * It will use the order number 0. This method will be called every frame. <br/>
     * 参数为0是会被调用，每一帧都会调用此方法<br/>
     * Scheduled methods with a lower order value will be called before the ones that have a higher order value.<br/>
     * 低调用参数会在高调用参数调用前调用Scheduled方法 <br/>
     * Only one "update" method could be scheduled per node.</p>
     * 每个节点仅可使用一次Scheduled用于"update" </p>
     * @param {Number} delta
     */
    update:function (delta) {
        if (!this.startingPositionInitialized)
            return;

        delta *= this._fadeDelta;

        var newIdx, newIdx2, i, i2;
        var mov = 0;

        // Update current points 更新当前点
        var locNuPoints = this._nuPoints;
        var locPointState = this._pointState, locPointVertexes = this._pointVertexes, locVertices = this._vertices;
        var locColorPointer = this._colorPointer;

        for (i = 0; i < locNuPoints; i++) {
            locPointState[i] -= delta;

            if (locPointState[i] <= 0)
                mov++;
            else {
                newIdx = i - mov;
                if (mov > 0) {
                    // Move data 更改数据
                    locPointState[newIdx] = locPointState[i];
                    // Move point 更改点
                    locPointVertexes[newIdx * 2] = locPointVertexes[i * 2];
                    locPointVertexes[newIdx * 2 + 1] = locPointVertexes[i * 2 + 1];

                    // Move vertices 更改顶点
                    i2 = i * 2;
                    newIdx2 = newIdx * 2;
                    locVertices[newIdx2 * 2] = locVertices[i2 * 2];
                    locVertices[newIdx2 * 2 + 1] = locVertices[i2 * 2 + 1];
                    locVertices[(newIdx2 + 1) * 2] = locVertices[(i2 + 1) * 2];
                    locVertices[(newIdx2 + 1) * 2 + 1] = locVertices[(i2 + 1) * 2 + 1];

                    // Move color 更改颜色
                    newIdx2 *= 4;
                    locColorPointer[newIdx2 + 0] = locColorPointer[i2 + 0];
                    locColorPointer[newIdx2 + 1] = locColorPointer[i2 + 1];
                    locColorPointer[newIdx2 + 2] = locColorPointer[i2 + 2];
                    locColorPointer[newIdx2 + 4] = locColorPointer[i2 + 4];
                    locColorPointer[newIdx2 + 5] = locColorPointer[i2 + 5];
                    locColorPointer[newIdx2 + 6] = locColorPointer[i2 + 6];
                } else
                    newIdx2 = newIdx * 8;

                var op = locPointState[newIdx] * 255.0;
                locColorPointer[newIdx2 + 3] = op;
                locColorPointer[newIdx2 + 7] = op;
            }
        }
        locNuPoints -= mov;

        // Append new point 加入新的点
        var appendNewPoint = true;
        if (locNuPoints >= this._maxPoints)
            appendNewPoint = false;
        else if (locNuPoints > 0) {
            var a1 = cc.pDistanceSQ(cc.p(locPointVertexes[(locNuPoints - 1) * 2], locPointVertexes[(locNuPoints - 1) * 2 + 1]),
                this._positionR) < this._minSeg;
            var a2 = (locNuPoints == 1) ? false : (cc.pDistanceSQ(
                cc.p(locPointVertexes[(locNuPoints - 2) * 2], locPointVertexes[(locNuPoints - 2) * 2 + 1]), this._positionR) < (this._minSeg * 2.0));
            if (a1 || a2)
                appendNewPoint = false;
        }

        if (appendNewPoint) {
            locPointVertexes[locNuPoints * 2] = this._positionR.x;
            locPointVertexes[locNuPoints * 2 + 1] = this._positionR.y;
            locPointState[locNuPoints] = 1.0;

            // Color assignment 颜色分配
            var offset = locNuPoints * 8;

            var locDisplayedColor = this._displayedColor;
            locColorPointer[offset] = locDisplayedColor.r;
            locColorPointer[offset + 1] = locDisplayedColor.g;
            locColorPointer[offset + 2] = locDisplayedColor.b;
            //*((ccColor3B*)(m_pColorPointer + offset+4)) = this._color;
            locColorPointer[offset + 4] = locDisplayedColor.r;
            locColorPointer[offset + 5] = locDisplayedColor.g;
            locColorPointer[offset + 6] = locDisplayedColor.b;

            // Opacity 透明度
            locColorPointer[offset + 3] = 255;
            locColorPointer[offset + 7] = 255;

            // Generate polygon 生成多边形
            if (locNuPoints > 0 && this.fastMode) {
                if (locNuPoints > 1)
                    cc.vertexLineToPolygon(locPointVertexes, this._stroke, this._vertices, locNuPoints, 1);
                else
                    cc.vertexLineToPolygon(locPointVertexes, this._stroke, this._vertices, 0, 2);
            }
            locNuPoints++;
        }

        if (!this.fastMode)
            cc.vertexLineToPolygon(locPointVertexes, this._stroke, this._vertices, 0, locNuPoints);

        // Updated Tex Coords only if they are different than previous step 仅当与前一步不同时更新Tex坐标
        if (locNuPoints && this._previousNuPoints != locNuPoints) {
            var texDelta = 1.0 / locNuPoints;
            var locTexCoords = this._texCoords;
            for (i = 0; i < locNuPoints; i++) {
                locTexCoords[i * 4] = 0;
                locTexCoords[i * 4 + 1] = texDelta * i;

                locTexCoords[(i * 2 + 1) * 2] = 1;
                locTexCoords[(i * 2 + 1) * 2 + 1] = texDelta * i;
            }

            this._previousNuPoints = locNuPoints;
        }

        this._nuPoints = locNuPoints;
    }
});

/**
 * Please use new cc.MotionStreak instead. <br /> 请使用新的 cc.MotionStreak替代
 * Creates and initializes a motion streak with fade in seconds, minimum segments, stroke's width, color, texture filename or texture
 *设置参数：消失的时间(s)、最小分割尺寸、笔画宽度、颜色、纹理文件名或纹理来构建和初始化拖尾特效
 * @deprecated since v3.0 please use new cc.MotionStreak instead.
 * @param {Number} fade time to fade
 * @param {Number} minSeg minimum segment size
 * @param {Number} stroke stroke's width
 * @param {Number} color
 * @param {string|cc.Texture2D} texture texture filename or texture
 * @return {cc.MotionStreak}
 * @example
 * //example
 * new cc.MotionStreak(2, 3, 32, cc.color.GREEN, s_streak);
 */
cc.MotionStreak.create = function (fade, minSeg, stroke, color, texture) {
    return new cc.MotionStreak(fade, minSeg, stroke, color, texture);
};
