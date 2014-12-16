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
 * FBO class that grabs the the contents of the screen	   FBO类：用来抓取屏幕上的内容
 * @class						   @class			
 * @extends cc.Class					   @extends cc.Class
 */
cc.Grabber = cc.Class.extend({
    _FBO:null,
    _oldFBO:null,
    _oldClearColor:null,

    _gl:null,

    /**
     * constructor of cc.Grabber	 cc.Grabber的构造器     
     */
    ctor:function () {
        cc._checkWebGLRenderMode();
        this._gl = cc._renderContext;
        this._oldClearColor = [0, 0, 0, 0];
        this._oldFBO = null;
        // generate FBO
        this._FBO = this._gl.createFramebuffer();
    },

    /**
     * grab				抓取函数（grab）
     * @param {cc.Texture2D} texture	@param {cc.Texture2D}纹理
     */
    grab:function (texture) {
        var locGL = this._gl;
        this._oldFBO = locGL.getParameter(locGL.FRAMEBUFFER_BINDING);
        // bind	绑定
        locGL.bindFramebuffer(locGL.FRAMEBUFFER, this._FBO);
        // associate texture with FBO	将纹理连接到FBO
        locGL.framebufferTexture2D(locGL.FRAMEBUFFER, locGL.COLOR_ATTACHMENT0, locGL.TEXTURE_2D, texture._webTextureObj, 0);

        // check if it worked (probably worth doing :) )	 检查该函数是否工作（非常推荐这么做 :)）
        var status = locGL.checkFramebufferStatus(locGL.FRAMEBUFFER);
        if (status != locGL.FRAMEBUFFER_COMPLETE)
            cc.log("Frame Grabber: could not attach texture to frmaebuffer");
        locGL.bindFramebuffer(locGL.FRAMEBUFFER, this._oldFBO);
    },

    /**
     * should be invoked before drawing		在绘图之前应该被调用的函数
     * @param {cc.Texture2D} texture		@param{cc.Texture2D}纹理
     */
    beforeRender:function (texture) {
        var locGL = this._gl;
        this._oldFBO = locGL.getParameter(locGL.FRAMEBUFFER_BINDING);
        locGL.bindFramebuffer(locGL.FRAMEBUFFER, this._FBO);

        // save clear color		 将保存清晰的颜色
        this._oldClearColor = locGL.getParameter(locGL.COLOR_CLEAR_VALUE);

        // BUG XXX: doesn't work with RGB565.		BUG XXX:无法使用RGB565.
        locGL.clearColor(0, 0, 0, 0);

        // BUG #631: To fix #631, uncomment the lines with #631				 BUG #631:取消#631的注释行即可使用
        // Warning: But it CCGrabber won't work with 2 effects at the same time		 警告：但是CCGrabber无法同时使用两种特效
        //  glClearColor(0.0f,0.0f,0.0f,1.0f);    // #631
        locGL.clear(locGL.COLOR_BUFFER_BIT | locGL.DEPTH_BUFFER_BIT);
        //  glColorMask(true, true, true, false);    // #631
    },

    /**
     * should be invoked after drawing		在绘图完成后被调用的函数
     * @param {cc.Texture2D} texture		@param{cc.Texture2D}纹理
     */
    afterRender:function (texture) {
        var locGL = this._gl;
        locGL.bindFramebuffer(locGL.FRAMEBUFFER, this._oldFBO);
        locGL.colorMask(true, true, true, true);      // #631
    },

    /**
     * delete FBO		 删除FBO
     */
    destroy:function(){
        this._gl.deleteFramebuffer(this._FBO);
    }
});
