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

cc._tmp.WebGLTexture2D = function () {

    /**
     * <p>
     * This class allows to easily create OpenGL or Canvas 2D textures from images, text or raw data.                                    <br/>
	    * 这个类可以通过图片，文本或者原始数据容易的创建OpenGL 或者 Canvas 2D贴图。
     * The created cc.Texture2D object will always have power-of-two dimensions.                                                <br/>
	    * 创建的 cc.Texture2D 对象为2倍大小。
     * Depending on how you create the cc.Texture2D object, the actual image area of the texture might be smaller than the texture dimensions <br/>
     * 贴图实际的图片区域可能会比贴图尺寸小，这取决于你怎么创建 cc.Texture2D 对象
     *  i.e. "contentSize" != (pixelsWide, pixelsHigh) and (maxS, maxT) != (1.0, 1.0).                                           <br/>
     * Be aware that the content of the generated textures will be upside-down! </p> - 注意生成的贴图内容是上下颠倒的!
     * @name cc.Texture2D
     * @class
     * @extends cc.Class
     *
     * @property {WebGLTexture}     name            - <@readonly> WebGLTexture Object
     * @property {Number}           defaultPixelFormat - The default pixel format
     * @property {Number}           pixelFormat     - <@readonly> Pixel format of the texture
     * @property {Number}           pixelsWidth     - <@readonly> Width in pixels
     * @property {Number}           pixelsHeight    - <@readonly> Height in pixels
     * @property {Number}           width           - Content width in points
     * @property {Number}           height          - Content height in points
     * @property {cc.GLProgram}     shaderProgram   - The shader program used by drawAtPoint and drawInRect
     * @property {Number}           maxS            - Texture max S
     * @property {Number}           maxT            - Texture max T
     */
        //Original : Texture2DWebGL
    cc.Texture2D = cc.Class.extend(/** @lends cc.Texture2D# */{
        // By default PVR images are treated as if they don't have the alpha channel premultiplied
        // 默认PVR 图片按照没有预乘alpha通道处理的
        _pVRHaveAlphaPremultiplied: true,
        _pixelFormat: null,
        _pixelsWide: 0,
        _pixelsHigh: 0,
        _name: "",
        _contentSize: null,
        maxS: 0,
        maxT: 0,
        _hasPremultipliedAlpha: false,
        _hasMipmaps: false,

        shaderProgram: null,

        _isLoaded: false,
        _htmlElementObj: null,
        _webTextureObj: null,

        url: null,

        /**
         * constructor of cc.Texture2D － cc.Texture2D 的构造函数
         */
        ctor: function () {
            this._contentSize = cc.size(0, 0);
            this._pixelFormat = cc.Texture2D.defaultPixelFormat;
        },

        /**
         * release texture －释放贴图
         */
        releaseTexture: function () {
            if (this._webTextureObj)
                cc._renderContext.deleteTexture(this._webTextureObj);
            cc.loader.release(this.url);
        },

        /**
         * pixel format of the texture －贴图的像素格式
         * @return {Number}
         */
        getPixelFormat: function () {
            return this._pixelFormat;
        },

        /**
         * width in pixels － 像素宽
         * @return {Number}
         */
        getPixelsWide: function () {
            return this._pixelsWide;
        },

        /**
         * height in pixels － 像素高
         * @return {Number}
         */
        getPixelsHigh: function () {
            return this._pixelsHigh;
        },

        /**
         * get WebGLTexture Object － 获取WebGL贴图对象
         * @return {WebGLTexture}
         */
        getName: function () {
            return this._webTextureObj;
        },

        /**
         * content size  － 内容大小
         * @return {cc.Size}
         */
        getContentSize: function () {
            return cc.size(this._contentSize.width / cc.contentScaleFactor(), this._contentSize.height / cc.contentScaleFactor());
        },

        _getWidth: function () {
            return this._contentSize.width / cc.contentScaleFactor();
        },
        _getHeight: function () {
            return this._contentSize.height / cc.contentScaleFactor();
        },

        /**
         * get content size in pixels － 内容大小像素值
         * @return {cc.Size}
         */
        getContentSizeInPixels: function () {
            return this._contentSize;
        },

        /**
         * texture max S
         * @return {Number}
         */
        getMaxS: function () {
            return this.maxS;
        },

        /**
         * set texture max S
         * @param {Number} maxS
         */
        setMaxS: function (maxS) {
            this.maxS = maxS;
        },

        /**
         * get texture max T
         * @return {Number}
         */
        getMaxT: function () {
            return this.maxT;
        },

        /**
         * set texture max T
         * @param {Number} maxT
         */
        setMaxT: function (maxT) {
            this.maxT = maxT;
        },

        /**
         * return shader program used by drawAtPoint and drawInRect － 返回drawAtPoint 和 drawInRect两个函数使用的着色器程序
         * @return {cc.GLProgram}
         */
        getShaderProgram: function () {
            return this.shaderProgram;
        },

        /**
         * set shader program used by drawAtPoint and drawInRect － 设置drawAtPoint 和 drawInRect两个函数使用的着色器程序
         * @param {cc.GLProgram} shaderProgram
         */
        setShaderProgram: function (shaderProgram) {
            this.shaderProgram = shaderProgram;
        },

        /**
         * whether or not the texture has their Alpha premultiplied － 贴图是否预乘了alpha通道
         * @return {Boolean}
         */
        hasPremultipliedAlpha: function () {
            return this._hasPremultipliedAlpha;
        },

        /**
         * whether or not use mipmap - 是否使用了纹理映射
         * @return {Boolean}
         */
        hasMipmaps: function () {
            return this._hasMipmaps;
        },

        /**
         * description
         * @return {string}
         */
        description: function () {
            var _t = this;
            return "<cc.Texture2D | Name = " + _t._name + " | Dimensions = " + _t._pixelsWide + " x " + _t._pixelsHigh
                + " | Coordinates = (" + _t.maxS + ", " + _t.maxT + ")>";
        },

        /**
         * These functions are needed to create mutable textures - 创建可变贴图对象需要使用这些函数
         * @param {Array} data
         */
        releaseData: function (data) {
            data = null;
        },

        keepData: function (data, length) {
            //The texture data mustn't be saved becuase it isn't a mutable texture. － 不能保存贴图数据，因为它不是可变贴图对象。
            return data;
        },

        /**
         * Intializes with a texture2d with data － 使用texture2d数据初始化
         * @param {Array} data
         * @param {Number} pixelFormat
         * @param {Number} pixelsWide
         * @param {Number} pixelsHigh
         * @param {cc.Size} contentSize
         * @return {Boolean}
         */
        initWithData: function (data, pixelFormat, pixelsWide, pixelsHigh, contentSize) {
            var self = this, tex2d = cc.Texture2D;
            var gl = cc._renderContext;
            var format = gl.RGBA, type = gl.UNSIGNED_BYTE;

            var bitsPerPixel = cc.Texture2D._B[pixelFormat];

            var bytesPerRow = pixelsWide * bitsPerPixel / 8;
            if (bytesPerRow % 8 === 0) {
                gl.pixelStorei(gl.UNPACK_ALIGNMENT, 8);
            } else if (bytesPerRow % 4 === 0) {
                gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
            } else if (bytesPerRow % 2 === 0) {
                gl.pixelStorei(gl.UNPACK_ALIGNMENT, 2);
            } else {
                gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            }

            self._webTextureObj = gl.createTexture();
            cc.glBindTexture2D(self);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            // Specify OpenGL texture image － 指定OpenGL贴图格式
            switch (pixelFormat) {
                case tex2d.PIXEL_FORMAT_RGBA8888:
                    format = gl.RGBA;
                    break;
                case tex2d.PIXEL_FORMAT_RGB888:
                    format = gl.RGB;
                    break;
                case tex2d.PIXEL_FORMAT_RGBA4444:
                    type = gl.UNSIGNED_SHORT_4_4_4_4;
                    break;
                case tex2d.PIXEL_FORMAT_RGB5A1:
                    type = gl.UNSIGNED_SHORT_5_5_5_1;
                    break;
                case tex2d.PIXEL_FORMAT_RGB565:
                    type = gl.UNSIGNED_SHORT_5_6_5;
                    break;
                case tex2d.PIXEL_FORMAT_AI88:
                    format = gl.LUMINANCE_ALPHA;
                    break;
                case tex2d.PIXEL_FORMAT_A8:
                    format = gl.ALPHA;
                    break;
                case tex2d.PIXEL_FORMAT_I8:
                    format = gl.LUMINANCE;
                    break;
                default:
                    cc.assert(0, cc._LogInfos.Texture2D_initWithData);
            }
            gl.texImage2D(gl.TEXTURE_2D, 0, format, pixelsWide, pixelsHigh, 0, format, type, data);


            self._contentSize.width = contentSize.width;
            self._contentSize.height = contentSize.height;
            self._pixelsWide = pixelsWide;
            self._pixelsHigh = pixelsHigh;
            self._pixelFormat = pixelFormat;
            self.maxS = contentSize.width / pixelsWide;
            self.maxT = contentSize.height / pixelsHigh;

            self._hasPremultipliedAlpha = false;
            self._hasMipmaps = false;
            self.shaderProgram = cc.shaderCache.programForKey(cc.SHADER_POSITION_TEXTURE);

            self._isLoaded = true;

            return true;
        },

        /**
         Drawing extensions to make it easy to draw basic quads using a CCTexture2D object. － 这些绘制扩展函数使CCTexture2D对象绘制基本的quads变得简单。
         These functions require gl.TEXTURE_2D and both gl.VERTEX_ARRAY and gl.TEXTURE_COORD_ARRAY client states to be enabled. － 这些函数需要启用 gl.TEXTURE_2D， gl.VERTEX_ARRAY 以及 gl.TEXTURE_COORD_ARRAY
         */

        /**
         * draws a texture at a given point － 在给定点绘制贴图
         * @param {cc.Point} point
         */
        drawAtPoint: function (point) {
            var self = this;
            var coordinates = [
                0.0, self.maxT,
                self.maxS, self.maxT,
                0.0, 0.0,
                self.maxS, 0.0 ];

            var width = self._pixelsWide * self.maxS,
                height = self._pixelsHigh * self.maxT;

            var vertices = [
                point.x, point.y, 0.0,
                width + point.x, point.y, 0.0,
                point.x, height + point.y, 0.0,
                width + point.x, height + point.y, 0.0 ];

            cc.glEnableVertexAttribs(cc.VERTEX_ATTRIB_FLAG_POSITION | cc.VERTEX_ATTRIB_FLAG_TEX_COORDS);
            self._shaderProgram.use();
            self._shaderProgram.setUniformsForBuiltins();

            cc.glBindTexture2D(self);

            var gl = cc._renderContext;
            gl.vertexAttribPointer(cc.VERTEX_ATTRIB_POSITION, 2, gl.FLOAT, false, 0, vertices);
            gl.vertexAttribPointer(cc.VERTEX_ATTRIB_TEX_COORDS, 2, gl.FLOAT, false, 0, coordinates);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        },

        /**
         * draws a texture inside a rect － 在一个矩形内绘制贴图
         * @param {cc.Rect} rect
         */
        drawInRect: function (rect) {
            var self = this;
            var coordinates = [
                0.0, self.maxT,
                self.maxS, self.maxT,
                0.0, 0.0,
                self.maxS, 0.0];

            var vertices = [    rect.x, rect.y, /*0.0,*/
                rect.x + rect.width, rect.y, /*0.0,*/
                rect.x, rect.y + rect.height, /*0.0,*/
                rect.x + rect.width, rect.y + rect.height        /*0.0*/ ];

            cc.glEnableVertexAttribs(cc.VERTEX_ATTRIB_FLAG_POSITION | cc.VERTEX_ATTRIB_FLAG_TEX_COORDS);
            self._shaderProgram.use();
            self._shaderProgram.setUniformsForBuiltins();

            cc.glBindTexture2D(self);

            var gl = cc._renderContext;
            gl.vertexAttribPointer(cc.VERTEX_ATTRIB_POSITION, 2, gl.FLOAT, false, 0, vertices);
            gl.vertexAttribPointer(cc.VERTEX_ATTRIB_TEX_COORDS, 2, gl.FLOAT, false, 0, coordinates);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        },

        /**
         Extensions to make it easy to create a CCTexture2D object from an image file. － 此扩展函数实现了简单的从一个图片文件创建一个 CCTexture2D对象。
         Note that RGBA type textures will have their alpha premultiplied - use the blending mode (gl.ONE, gl.ONE_MINUS_SRC_ALPHA). － 注意RGBA类型的贴图预乘了他们的alpha通道－使用混合模式(gl.ONE, gl.ONE_MINUS_SRC_ALPHA).
         */

        /**
         * Initializes a texture from a UIImage object － 通过UIImage对象初始化贴图
         * @param uiImage
         * @return {Boolean}
         */
        initWithImage: function (uiImage) {
            if (uiImage == null) {
                cc.log(cc._LogInfos.Texture2D_initWithImage);
                return false;
            }

            var imageWidth = uiImage.getWidth();
            var imageHeight = uiImage.getHeight();

            var maxTextureSize = cc.configuration.getMaxTextureSize();
            if (imageWidth > maxTextureSize || imageHeight > maxTextureSize) {
                cc.log(cc._LogInfos.Texture2D_initWithImage_2, imageWidth, imageHeight, maxTextureSize, maxTextureSize);
                return false;
            }
            this._isLoaded = true;

            // always load premultiplied images － 总是加载预乘的图片
            return this._initPremultipliedATextureWithImage(uiImage, imageWidth, imageHeight);
        },

        /**
         * init with HTML element － 通过HTML元素初始化
         * @param {HTMLImageElement|HTMLCanvasElement} element
         */
        initWithElement: function (element) {
            if (!element)
                return;
            this._webTextureObj = cc._renderContext.createTexture();
            this._htmlElementObj = element;
        },

        /**
         * HTMLElement Object getter - 获取HTMLElement对象
         * @return {HTMLElement}
         */
        getHtmlElementObj: function () {
            return this._htmlElementObj;
        },

        /**
         * whether texture is loaded － 返回贴图是否加载完成
         * @return {Boolean}
         */
        isLoaded: function () {
            return this._isLoaded;
        },

        /**
         * handler of texture loaded event － 贴图加载完成之后的处理函数
         */
        handleLoadedTexture: function () {
            var self = this;
            // Not sure about this ! Some texture need to be updated even after loaded － 不确定！？？ 加载完成之后有些贴图需要更新
            if (!cc._rendererInitialized)
                return;
            if (!self._htmlElementObj) {
                var img = cc.loader.getRes(self.url);
                if (!img) return;
                self.initWithElement(img);
            }
            if (!self._htmlElementObj.width || !self._htmlElementObj.height)
                return;
            self._isLoaded = true;
            //upload image to buffer - 上传图片到缓冲区
            var gl = cc._renderContext;

            cc.glBindTexture2D(self);

            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);

            // Specify OpenGL texture image － 指定OpenGL 贴图图片
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, self._htmlElementObj);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            self.shaderProgram = cc.shaderCache.programForKey(cc.SHADER_POSITION_TEXTURE);
            cc.glBindTexture2D(null);

            var pixelsWide = self._htmlElementObj.width;
            var pixelsHigh = self._htmlElementObj.height;

            self._pixelsWide = self._contentSize.width = pixelsWide;
            self._pixelsHigh = self._contentSize.height = pixelsHigh;
            self._pixelFormat = cc.Texture2D.PIXEL_FORMAT_RGBA8888;
            self.maxS = 1;
            self.maxT = 1;

            self._hasPremultipliedAlpha = false;
            self._hasMipmaps = false;

            //dispatch load event to listener. － 向监听者分发加载事件。
            self.dispatchEvent("load");
        },

        /**
         Extensions to make it easy to create a cc.Texture2D object from a string of text. － 此扩展函数实现了简单的使用文本字符串创建一个cc.Texture2D对象
         Note that the generated textures are of type A8 - use the blending mode (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA). － 注意生成的贴图是使用混合模式的A8类型(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA).
         */
        /**
         * Initializes a texture from a string with dimensions, alignment, font name and font size (note: initWithString does not support on HTML5) － 从一个包含尺寸，对齐方式，字体名称，字体大小的字符串初始化一个贴图对象(注意: initWithString 不支持HTML5)
         * @param {String} text
         * @param {String | cc.FontDefinition} fontName or fontDefinition
         * @param {Number} fontSize
         * @param {cc.Size} dimensions
         * @param {Number} hAlignment
         * @param {Number} vAlignment
         * @return {Boolean}
         */
        initWithString: function (text, fontName, fontSize, dimensions, hAlignment, vAlignment) {
            cc.log(cc._LogInfos.Texture2D_initWithString);
            return null;
        },

        /**
         * Initializes a texture from a ETC file  (note: initWithETCFile does not support on HTML5) - 通过ETC文件初始化贴图（注意：initWithETCFile 不支持HTML5)
         * @note Compatible to Cocos2d-x
         * @param {String} file
         * @return {Boolean}
         */
        initWithETCFile: function (file) {
            cc.log(cc._LogInfos.Texture2D_initWithETCFile_2);
            return false;
        },

        /**
         * Initializes a texture from a PVR file - 从 PVR文件初始化贴图
         * @param {String} file
         * @return {Boolean}
         */
        initWithPVRFile: function (file) {
            cc.log(cc._LogInfos.Texture2D_initWithPVRFile_2);
            return false;
        },

        /**
         Extensions to make it easy to create a cc.Texture2D object from a PVRTC file － 此扩展函数实现了简单的从 PVRTC 文件创建 cc.Texture2D 对象
         Note that the generated textures don't have their alpha premultiplied - use the blending mode (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA). － 注意生成的贴图没有预乘它们的alpha通道 － 使用混合模式 (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA).
         */
        /**
         * Initializes a texture from a PVRTC buffer － 通过PVRTC缓冲数据初始化贴图
         * @note compatible to cocos2d-iphone interface. － 注意适配 cocos2d-iphone 接口
         * @param {Array} data
         * @param {Number} level
         * @param {Number} bpp
         * @param {Boolean} hasAlpha
         * @param {Number} length
         * @param {Number} pixelFormat
         * @return {Boolean}
         */
        initWithPVRTCData: function (data, level, bpp, hasAlpha, length, pixelFormat) {
            cc.log(cc._LogInfos.Texture2D_initWithPVRTCData_2);
            return false;
        },

        /**
         * sets the min filter, mag filter, wrap s and wrap t texture parameters. <br/>
		 * 设置贴图参数 min filter, mag filter, wrap s 和 wrap t
         * If the texture size is NPOT (non power of 2), then in can only use gl.CLAMP_TO_EDGE in gl.TEXTURE_WRAP_{S,T}.
 		 * 如果贴图不是2倍大小，只能使用 gl.CLAMP_TO_EDGE in gl.TEXTURE_WRAP_{S,T}.
         * @param {Object|Number} texParams texParams object or minFilter
         * @param {Number} [magFilter]
         * @param {Number} [wrapS]
         * @param {Number} [wrapT]
         */
        setTexParameters: function (texParams, magFilter, wrapS, wrapT) {
            var _t = this;
            var gl = cc._renderContext;

            if(magFilter !== undefined)
                texParams = {minFilter: texParams, magFilter: magFilter, wrapS: wrapS, wrapT: wrapT};

            cc.assert((_t._pixelsWide == cc.NextPOT(_t._pixelsWide) && _t._pixelsHigh == cc.NextPOT(_t._pixelsHigh)) ||
                (texParams.wrapS == gl.CLAMP_TO_EDGE && texParams.wrapT == gl.CLAMP_TO_EDGE),
                "WebGLRenderingContext.CLAMP_TO_EDGE should be used in NPOT textures");

            cc.glBindTexture2D(_t);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texParams.minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texParams.magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, texParams.wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, texParams.wrapT);
        },

        /**
         * sets antialias texture parameters:              <br/> - 设置抗锯齿贴图参数
         *  - GL_TEXTURE_MIN_FILTER = GL_NEAREST           <br/>
         *  - GL_TEXTURE_MAG_FILTER = GL_NEAREST
         */
        setAntiAliasTexParameters: function () {
            var gl = cc._renderContext;

            cc.glBindTexture2D(this);
            if (!this._hasMipmaps)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            else
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        },

        /**
         *  sets alias texture parameters: - 设置锯齿贴图参数
         *   GL_TEXTURE_MIN_FILTER = GL_NEAREST
         *   GL_TEXTURE_MAG_FILTER = GL_NEAREST
         */
        setAliasTexParameters: function () {
            var gl = cc._renderContext;

            cc.glBindTexture2D(this);
            if (!this._hasMipmaps)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            else
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        },

        /**
         *  Generates mipmap images for the texture.<br/>  － 生成贴图的纹理映射图
         *  It only works if the texture size is POT (power of 2). － 只对二倍大小的贴图有效。
         */
        generateMipmap: function () {
            var _t = this;
            cc.assert(_t._pixelsWide == cc.NextPOT(_t._pixelsWide) && _t._pixelsHigh == cc.NextPOT(_t._pixelsHigh), "Mimpap texture only works in POT textures");

            cc.glBindTexture2D(_t);
            cc._renderContext.generateMipmap(cc._renderContext.TEXTURE_2D);
            _t._hasMipmaps = true;
        },

        /**
         * returns the pixel format. － 返回像素格式。
         * @return {String}
         */
        stringForFormat: function () {
            return cc.Texture2D._M[this._pixelFormat];
        },

        /**
         * returns the bits-per-pixel of the in-memory OpenGL texture － 返回 OpenGL 贴图在内存中每像素占用的比特位
         * @return {Number}
         */
        bitsPerPixelForFormat: function (format) {//TODO I want to delete the format argument, use this._pixelFormat
            format = format || this._pixelFormat;
            var value = cc.Texture2D._B[format];
            if (value != null) return value;
            cc.log(cc._LogInfos.Texture2D_bitsPerPixelForFormat, format);
            return -1;
        },

        _initPremultipliedATextureWithImage: function (uiImage, width, height) {
            var tex2d = cc.Texture2D;
            var tempData = uiImage.getData();
            var inPixel32 = null;
            var inPixel8 = null;
            var outPixel16 = null;
            var hasAlpha = uiImage.hasAlpha();
            var imageSize = cc.size(uiImage.getWidth(), uiImage.getHeight());
            var pixelFormat = tex2d.defaultPixelFormat;
            var bpp = uiImage.getBitsPerComponent();
            var i;

            // compute pixel format － 计算像素格式
            if (!hasAlpha) {
                if (bpp >= 8) {
                    pixelFormat = tex2d.PIXEL_FORMAT_RGB888;
                } else {
                    cc.log(cc._LogInfos.Texture2D__initPremultipliedATextureWithImage);
                    pixelFormat = tex2d.PIXEL_FORMAT_RGB565;
                }
            }

            // Repack the pixel data into the right format － 将像素数据包装成正确的格式
            var length = width * height;

            if (pixelFormat == tex2d.PIXEL_FORMAT_RGB565) {
                if (hasAlpha) {
                    // Convert "RRRRRRRRRGGGGGGGGBBBBBBBBAAAAAAAA" to "RRRRRGGGGGGBBBBB"
                    tempData = new Uint16Array(width * height);
                    inPixel32 = uiImage.getData();

                    for (i = 0; i < length; ++i) {
                        tempData[i] =
                            ((((inPixel32[i] >> 0) & 0xFF) >> 3) << 11) | // R
                                ((((inPixel32[i] >> 8) & 0xFF) >> 2) << 5) | // G
                                ((((inPixel32[i] >> 16) & 0xFF) >> 3) << 0);    // B
                    }
                } else {
                    // Convert "RRRRRRRRRGGGGGGGGBBBBBBBB" to "RRRRRGGGGGGBBBBB"
                    tempData = new Uint16Array(width * height);
                    inPixel8 = uiImage.getData();

                    for (i = 0; i < length; ++i) {
                        tempData[i] =
                            (((inPixel8[i] & 0xFF) >> 3) << 11) | // R
                                (((inPixel8[i] & 0xFF) >> 2) << 5) | // G
                                (((inPixel8[i] & 0xFF) >> 3) << 0);    // B
                    }
                }
            } else if (pixelFormat == tex2d.PIXEL_FORMAT_RGBA4444) {
                // Convert "RRRRRRRRRGGGGGGGGBBBBBBBBAAAAAAAA" to "RRRRGGGGBBBBAAAA"
                tempData = new Uint16Array(width * height);
                inPixel32 = uiImage.getData();

                for (i = 0; i < length; ++i) {
                    tempData[i] =
                        ((((inPixel32[i] >> 0) & 0xFF) >> 4) << 12) | // R
                            ((((inPixel32[i] >> 8) & 0xFF) >> 4) << 8) | // G
                            ((((inPixel32[i] >> 16) & 0xFF) >> 4) << 4) | // B
                            ((((inPixel32[i] >> 24) & 0xFF) >> 4) << 0);  // A
                }
            } else if (pixelFormat == tex2d.PIXEL_FORMAT_RGB5A1) {
                // Convert "RRRRRRRRRGGGGGGGGBBBBBBBBAAAAAAAA" to "RRRRRGGGGGBBBBBA"
                tempData = new Uint16Array(width * height);
                inPixel32 = uiImage.getData();

                for (i = 0; i < length; ++i) {
                    tempData[i] =
                        ((((inPixel32[i] >> 0) & 0xFF) >> 3) << 11) | // R
                            ((((inPixel32[i] >> 8) & 0xFF) >> 3) << 6) | // G
                            ((((inPixel32[i] >> 16) & 0xFF) >> 3) << 1) | // B
                            ((((inPixel32[i] >> 24) & 0xFF) >> 7) << 0);  // A
                }
            } else if (pixelFormat == tex2d.PIXEL_FORMAT_A8) {
                // Convert "RRRRRRRRRGGGGGGGGBBBBBBBBAAAAAAAA" to "AAAAAAAA"
                tempData = new Uint8Array(width * height);
                inPixel32 = uiImage.getData();

                for (i = 0; i < length; ++i) {
                    tempData[i] = (inPixel32 >> 24) & 0xFF;  // A
                }
            }

            if (hasAlpha && pixelFormat == tex2d.PIXEL_FORMAT_RGB888) {
                // Convert "RRRRRRRRRGGGGGGGGBBBBBBBBAAAAAAAA" to "RRRRRRRRGGGGGGGGBBBBBBBB"
                inPixel32 = uiImage.getData();
                tempData = new Uint8Array(width * height * 3);

                for (i = 0; i < length; ++i) {
                    tempData[i * 3] = (inPixel32 >> 0) & 0xFF; // R
                    tempData[i * 3 + 1] = (inPixel32 >> 8) & 0xFF; // G
                    tempData[i * 3 + 2] = (inPixel32 >> 16) & 0xFF; // B
                }
            }

            this.initWithData(tempData, pixelFormat, width, height, imageSize);

            if (tempData != uiImage.getData())
                tempData = null;

            this._hasPremultipliedAlpha = uiImage.isPremultipliedAlpha();
            return true;
        },

        /**
         * add listener for loaded event － 加载事件增加监听
         * @param {Function} callback
         * @param {cc.Node} target
         * @deprecated since 3.1, please use addEventListener instead － 从3.1版弃用，请使用 addEventListener
         */
        addLoadedEventListener: function (callback, target) {
            this.addEventListener("load", callback, target);
        },

        /**
         * remove listener from listeners by target  - 移除特定目标的监听
         * @param {cc.Node} target
         * @deprecated since 3.1, please use addEventListener instead
         */
        removeLoadedEventListener: function (target) {
            this.removeEventListener("load", target);
        }
    });
};

cc._tmp.WebGLTextureAtlas = function () {
    var _p = cc.TextureAtlas.prototype;
    _p._setupVBO = function () {
        var _t = this;
        var gl = cc._renderContext;
        //create WebGLBuffer
        _t._buffersVBO[0] = gl.createBuffer();
        _t._buffersVBO[1] = gl.createBuffer();

        _t._quadsWebBuffer = gl.createBuffer();
        _t._mapBuffers();
    };

    _p._mapBuffers = function () {
        var _t = this;
        var gl = cc._renderContext;

        gl.bindBuffer(gl.ARRAY_BUFFER, _t._quadsWebBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, _t._quadsArrayBuffer, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _t._buffersVBO[1]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, _t._indices, gl.STATIC_DRAW);

        //cc.checkGLErrorDebug();
    };

    /**
     * <p>Draws n quads from an index (offset). <br /> － 从某个index开始绘制n个quads
     * n + start can't be greater than the capacity of the atlas</p>
     * @param {Number} n
     * @param {Number} start
     */
    _p.drawNumberOfQuads = function (n, start) {
        var _t = this;
        start = start || 0;
        if (0 === n || !_t.texture || !_t.texture.isLoaded())
            return;

        var gl = cc._renderContext;
        cc.glBindTexture2D(_t.texture);

        //
        // Using VBO without VAO
        //
        //vertices
        //gl.bindBuffer(gl.ARRAY_BUFFER, _t._buffersVBO[0]);
        // XXX: update is done in draw... perhaps it should be done in a timer
        cc.glEnableVertexAttribs(cc.VERTEX_ATTRIB_FLAG_POS_COLOR_TEX);

        gl.bindBuffer(gl.ARRAY_BUFFER, _t._quadsWebBuffer);
        if (_t.dirty)
            gl.bufferData(gl.ARRAY_BUFFER, _t._quadsArrayBuffer, gl.DYNAMIC_DRAW);

        gl.vertexAttribPointer(cc.VERTEX_ATTRIB_POSITION, 3, gl.FLOAT, false, 24, 0);               // vertices
        gl.vertexAttribPointer(cc.VERTEX_ATTRIB_COLOR, 4, gl.UNSIGNED_BYTE, true, 24, 12);          // colors
        gl.vertexAttribPointer(cc.VERTEX_ATTRIB_TEX_COORDS, 2, gl.FLOAT, false, 24, 16);            // tex coords

        if (_t.dirty)
            _t.dirty = false;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _t._buffersVBO[1]);

        if (cc.TEXTURE_ATLAS_USE_TRIANGLE_STRIP)
            gl.drawElements(gl.TRIANGLE_STRIP, n * 6, gl.UNSIGNED_SHORT, start * 6 * _t._indices.BYTES_PER_ELEMENT);
        else
            gl.drawElements(gl.TRIANGLES, n * 6, gl.UNSIGNED_SHORT, start * 6 * _t._indices.BYTES_PER_ELEMENT);

        cc.g_NumberOfDraws++;
        //cc.checkGLErrorDebug();
    };
};

cc._tmp.WebGLTextureCache = function () {
    var _p = cc.textureCache;

    _p.handleLoadedTexture = function (url) {
        var locTexs = this._textures;
        //remove judge(webgl)
        if (!cc._rendererInitialized) {
            locTexs = this._loadedTexturesBefore;
        }
        var tex = locTexs[url];
        if (!tex) {
            tex = locTexs[url] = new cc.Texture2D();
            tex.url = url;
        }
        tex.handleLoadedTexture();
    };

    /**
     * <p>Returns a Texture2D object given an file image <br />  － 通过文件路径的图片返回 Texture2D 对象
     * If the file image was not previously loaded, it will create a new Texture2D <br />
     *  object and it will return it. It will use the filename as a key.<br />
     * Otherwise it will return a reference of a previously loaded image. <br />
	    * 如果图片之前未被加载，会创建一个新的 Texture2D 对象返回，并用文件名作为key. 否则会返回之前已经加载好的图片的引用。
     * Supported image extensions: .png, .jpg, .gif</p>
   	 * 支持的图片扩展名: .png, .jpg, .gif
     * @param {String} url
     * @param {Function} cb
     * @param {Object} target
     * @return {cc.Texture2D}
     * @example
     * //example
     * cc.textureCache.addImage("hello.png");
     */
    _p.addImage = function (url, cb, target) {
        cc.assert(url, cc._LogInfos.Texture2D_addImage_2);

        var locTexs = this._textures;
        //remove judge(webgl)
        if (!cc._rendererInitialized) {
            locTexs = this._loadedTexturesBefore;
        }
        var tex = locTexs[url] || locTexs[cc.loader._aliases[url]];
        if (tex) {
            cb && cb.call(target, tex);
            return tex;
        }

        if (!cc.loader.getRes(url)) {
            if (cc.loader._checkIsImageURL(url)) {
                cc.loader.load(url, function (err) {
                    cb && cb.call(target);
                });
            } else {
                cc.loader.loadImg(url, function (err, img) {
                    if (err)
                        return cb ? cb(err) : err;
                    cc.loader.cache[url] = img;
                    cc.textureCache.handleLoadedTexture(url);
                    cb && cb.call(target, tex);
                });
            }
        }

        tex = locTexs[url] = new cc.Texture2D();
        tex.url = url;
        return tex;
    };
     _p = null;
};
