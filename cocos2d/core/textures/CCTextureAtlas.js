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
 * <p>A class that implements a Texture Atlas. 当前类实现了一个贴图集。<br />
 * Supported features: 支持的功能：<br />
 * The atlas file can be a PNG, JPG. 图集文件可能是一个PNG, JPG。<br />
 * Quads can be updated in runtime 运行时可以更新Quads <br />
 * Quads can be added in runtime 运行时可以添加Quads <br />
 * Quads can be removed in runtime 运行时可以删除Quads <br />
 * Quads can be re-ordered in runtime 运行时可以重新排序Quads <br />
 * The TextureAtlas capacity can be increased or decreased in runtime. 运行时TextureAtlas的占用空间可以增加或者减少。</p>
 * @class
 * @extends cc.Class
 *
 * @property {Boolean}  dirty           - Indicates whether or not the array buffer of the VBO needs to be updated. 指示VBO的数组缓冲是否需要更新
 * @property {Image}    texture         - Image texture for cc.TextureAtlas. cc.TextureAtlas的图片贴图
 * @property {Number}   capacity        - <@readonly> Quantity of quads that can be stored with the current texture atlas size. 当前贴图集的大小可以存储的quads的数量
 * @property {Number}   totalQuads      - <@readonly> Quantity of quads that are going to be drawn. 即将绘制的quads的数量。
 * @property {Array}    quads           - <@readonly> Quads that are going to be rendered 即将渲染的quads
 */
cc.TextureAtlas = cc.Class.extend(/** @lends cc.TextureAtlas# */{
    dirty: false,
    texture: null,

    _indices: null,
    //0: vertex  1: indices
    _buffersVBO: null,
    _capacity: 0,

    _quads: null,
    _quadsArrayBuffer: null,
    _quadsWebBuffer: null,
    _quadsReader: null,

    /**
     * <p>Creates a TextureAtlas with an filename and with an initial capacity for Quads. 通过文件名和初始大小创建TextureAtlas。<br />
     * The TextureAtlas capacity can be increased in runtime. TextureAtlas的占用空间大小可以在运行时增加。</p>
     * Constructor of cc.TextureAtlas
     * @param {String|cc.Texture2D} fileName
     * @param {Number} capacity
     * @example @示例
     * 1.
     * //creates a TextureAtlas with  filename  用文件名创建TextureAtlas。
     * var textureAtlas = new cc.TextureAtlas("res/hello.png", 3);
     * 2.
     * //creates a TextureAtlas with texture 用贴图创建TextureAtlas。
     * var texture = cc.textureCache.addImage("hello.png");
     * var textureAtlas = new cc.TextureAtlas(texture, 3);
     */
    ctor: function (fileName, capacity) {
        this._buffersVBO = [];

        if (cc.isString(fileName)) {
            this.initWithFile(fileName, capacity);
        } else if (fileName instanceof cc.Texture2D) {
            this.initWithTexture(fileName, capacity);
        }
    },

    /**
     * Quantity of quads that are going to be drawn. 即将绘制的quads数量
     * @return {Number}
     */
    getTotalQuads: function () {
        //return this._quads.length;
        return this._totalQuads;
    },

    /**
     * Quantity of quads that can be stored with the current texture atlas size 当前贴图集的空间大小可以存储的quads的数量
     * @return {Number}
     */
    getCapacity: function () {
        return this._capacity;
    },

    /**
     * Texture of the texture atlas 获取贴图集中的贴图对象
     * @return {Image}
     */
    getTexture: function () {
        return this.texture;
    },

    /**
     * @param {Image} texture
     */
    setTexture: function (texture) {
        this.texture = texture;
    },

    /**
     * specify if the array buffer of the VBO needs to be updated 设置VBO的数组缓冲是否需要更新
     * @param {Boolean} dirty
     */
    setDirty: function (dirty) {
        this.dirty = dirty;
    },

    /**
     * whether or not the array buffer of the VBO needs to be updated VBO的数组缓冲是否需要更新
     * @returns {boolean}
     */
    isDirty: function () {
        return this.dirty;
    },

    /**
     * Quads that are going to be rendered 即将缓冲的Quads
     * @return {Array}
     */
    getQuads: function () {
        return this._quads;
    },

    /**
     * @param {Array} quads
     */
    setQuads: function (quads) {
        this._quads = quads;
        //TODO need re-binding
    },

    _copyQuadsToTextureAtlas: function (quads, index) {
        if (!quads)
            return;

        for (var i = 0; i < quads.length; i++)
            this._setQuadToArray(quads[i], index + i);
    },

    _setQuadToArray: function (quad, index) {
        var locQuads = this._quads;
        if (!locQuads[index]) {
            locQuads[index] = new cc.V3F_C4B_T2F_Quad(quad.tl, quad.bl, quad.tr, quad.br, this._quadsArrayBuffer, index * cc.V3F_C4B_T2F_Quad.BYTES_PER_ELEMENT);
            return;
        }
        locQuads[index].bl = quad.bl;
        locQuads[index].br = quad.br;
        locQuads[index].tl = quad.tl;
        locQuads[index].tr = quad.tr;
    },

    /**
     * Description 描述
     * @return {String}
     */
    description: function () {
        return '<cc.TextureAtlas | totalQuads =' + this._totalQuads + '>';
    },

    _setupIndices: function () {
        if (this._capacity === 0)
            return;
        var locIndices = this._indices, locCapacity = this._capacity;
        for (var i = 0; i < locCapacity; i++) {
            if (cc.TEXTURE_ATLAS_USE_TRIANGLE_STRIP) {
                locIndices[i * 6 + 0] = i * 4 + 0;
                locIndices[i * 6 + 1] = i * 4 + 0;
                locIndices[i * 6 + 2] = i * 4 + 2;
                locIndices[i * 6 + 3] = i * 4 + 1;
                locIndices[i * 6 + 4] = i * 4 + 3;
                locIndices[i * 6 + 5] = i * 4 + 3;
            } else {
                locIndices[i * 6 + 0] = i * 4 + 0;
                locIndices[i * 6 + 1] = i * 4 + 1;
                locIndices[i * 6 + 2] = i * 4 + 2;

                // inverted index. issue #179
                locIndices[i * 6 + 3] = i * 4 + 3;
                locIndices[i * 6 + 4] = i * 4 + 2;
                locIndices[i * 6 + 5] = i * 4 + 1;
            }
        }
    },

    _setupVBO: function () {
        var gl = cc._renderContext;
        //create WebGLBuffer
        this._buffersVBO[0] = gl.createBuffer();
        this._buffersVBO[1] = gl.createBuffer();

        this._quadsWebBuffer = gl.createBuffer();
        this._mapBuffers();
    },

    _mapBuffers: function () {
        var gl = cc._renderContext;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadsWebBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._quadsArrayBuffer, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._buffersVBO[1]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indices, gl.STATIC_DRAW);
    },

    /**
     * <p>Initializes a TextureAtlas with a filename and with a certain capacity for Quads. 通过文件名和Quads数初始化TextureAtlas。<br />
     * The TextureAtlas capacity can be increased in runtime. 运行时TextureAtlas的占用空间大小可以增加。<br />
     * WARNING: Do not reinitialize the TextureAtlas because it will leak memory. 注意：不要重复初始化TextureAtlas，那会造成造成内存泄漏。</p>
     * @param {String} file
     * @param {Number} capacity
     * @return {Boolean}
     * @example
     * //example
     * var textureAtlas = new cc.TextureAtlas();
     * textureAtlas.initWithTexture("hello.png", 3);
     */
    initWithFile: function (file, capacity) {
        // retained in property
        var texture = cc.textureCache.addImage(file);
        if (texture)
            return this.initWithTexture(texture, capacity);
        else {
            cc.log(cc._LogInfos.TextureAtlas_initWithFile, file);
            return false;
        }
    },

    /**
     * <p>Initializes a TextureAtlas with a previously initialized Texture2D object, and<br />
     * with an initial capacity for Quads. 通过一个之前初始化好的 Texture2D 对象和Quads的大小来初始化 TextureAtlas <br />
     * The TextureAtlas capacity can be increased in runtime. 运行时可以增加TextureAtlas的占用空间大小。<br />
     * WARNING: Do not reinitialize the TextureAtlas because it will leak memory 注意：不要重复初始化 TextureAtlas,会造成内存泄漏。</p>
     * @param {Image} texture
     * @param {Number} capacity
     * @return {Boolean}
     * @example
     * //example
     * var texture = cc.textureCache.addImage("hello.png");
     * var textureAtlas = new cc.TextureAtlas();
     * textureAtlas.initWithTexture(texture, 3);
     */
    initWithTexture: function (texture, capacity) {
        cc.assert(texture, cc._LogInfos.TextureAtlas_initWithTexture);

        capacity = 0 | (capacity);
        this._capacity = capacity;
        this._totalQuads = 0;

        // retained in property
        this.texture = texture;

        // Re-initialization is not allowed
        this._quads = [];
        this._indices = new Uint16Array(capacity * 6);
        var quadSize = cc.V3F_C4B_T2F_Quad.BYTES_PER_ELEMENT;
        this._quadsArrayBuffer = new ArrayBuffer(quadSize * capacity);
        this._quadsReader = new Uint8Array(this._quadsArrayBuffer);

        if (!( this._quads && this._indices) && capacity > 0)
            return false;

        var locQuads = this._quads;
        for (var i = 0; i < capacity; i++)
            locQuads[i] = new cc.V3F_C4B_T2F_Quad(null, null, null, null, this._quadsArrayBuffer, i * quadSize);

        this._setupIndices();
        this._setupVBO();
        this.dirty = true;
        return true;
    },

    /**
     * <p>Updates a Quad (texture, vertex and color) at a certain index 更新特定index的Quad(贴图，顶点，颜色) <br />
     * index must be between 0 and the atlas capacity - 1 --index 必须是在0～图集的大小 - 1</p>
     * @param {cc.V3F_C4B_T2F_Quad} quad
     * @param {Number} index
     */
    updateQuad: function (quad, index) {
        cc.assert(quad, cc._LogInfos.TextureAtlas_updateQuad);
        cc.assert(index >= 0 && index < this._capacity, cc._LogInfos.TextureAtlas_updateQuad_2);

        this._totalQuads = Math.max(index + 1, this._totalQuads);
        this._setQuadToArray(quad, index);
        this.dirty = true;
    },

    /**
     * <p>Inserts a Quad (texture, vertex and color) at a certain index 在特定index插入一个Quad(贴图，顶点和颜色) <br />
     * index must be between 0 and the atlas capacity - 1 --index 必须是在0～图集的大小 - 1</p>
     * @param {cc.V3F_C4B_T2F_Quad} quad
     * @param {Number} index
     */
    insertQuad: function (quad, index) {
        cc.assert(index < this._capacity, cc._LogInfos.TextureAtlas_insertQuad_2);

        this._totalQuads++;
        if (this._totalQuads > this._capacity) {
            cc.log(cc._LogInfos.TextureAtlas_insertQuad);
            return;
        }
        var quadSize = cc.V3F_C4B_T2F_Quad.BYTES_PER_ELEMENT;
        // issue #575. index can be > totalQuads
        var remaining = (this._totalQuads - 1) - index;
        var startOffset = index * quadSize;
        var moveLength = remaining * quadSize;
        this._quads[this._totalQuads - 1] = new cc.V3F_C4B_T2F_Quad(null, null, null, null, this._quadsArrayBuffer, (this._totalQuads - 1) * quadSize);
        this._quadsReader.set(this._quadsReader.subarray(startOffset, startOffset + moveLength), startOffset + quadSize);

        this._setQuadToArray(quad, index);
        this.dirty = true;
    },

    /**
     * <p>
     *      Inserts a c array of quads at a given index                                           <br />
	 *		给定index 插入一个quads的c数组
     *      index must be between 0 and the atlas capacity - 1                                    <br />
	 *		index 必须是在0～图集的大小 - 1
     *      this method doesn't enlarge the array when amount + index > totalQuads                <br />
	 *		当amount + index > totalQuads时，这个方法不会加大数组
     * </p>
     * @param {Array} quads
     * @param {Number} index
     * @param {Number} amount
     */
    insertQuads: function (quads, index, amount) {
        amount = amount || quads.length;

        cc.assert((index + amount) <= this._capacity, cc._LogInfos.TextureAtlas_insertQuads);

        var quadSize = cc.V3F_C4B_T2F_Quad.BYTES_PER_ELEMENT;
        this._totalQuads += amount;
        if (this._totalQuads > this._capacity) {
            cc.log(cc._LogInfos.TextureAtlas_insertQuad);
            return;
        }

        // issue #575. index can be > totalQuads
        var remaining = (this._totalQuads - 1) - index - amount;
        var startOffset = index * quadSize;
        var moveLength = remaining * quadSize;
        var lastIndex = (this._totalQuads - 1) - amount;

        var i;
        for (i = 0; i < amount; i++)
            this._quads[lastIndex + i] = new cc.V3F_C4B_T2F_Quad(null, null, null, null, this._quadsArrayBuffer, (this._totalQuads - 1) * quadSize);
        this._quadsReader.set(this._quadsReader.subarray(startOffset, startOffset + moveLength), startOffset + quadSize * amount);
        for (i = 0; i < amount; i++)
            this._setQuadToArray(quads[i], index + i);

        this.dirty = true;
    },

    /**
     * <p>Removes the quad that is located at a certain index and inserts it at a new index <br />
	 * 删除某个特定index位置的quad, 把它插入到一个新的index位置
     * This operation is faster than removing and inserting in a quad in 2 different steps</p>
     * 这种方式比先删除再插入执行2步操作效率要高
     * @param {Number} fromIndex
     * @param {Number} newIndex
     */
    insertQuadFromIndex: function (fromIndex, newIndex) {
        if (fromIndex === newIndex)
            return;

        cc.assert(newIndex >= 0 || newIndex < this._totalQuads, cc._LogInfos.TextureAtlas_insertQuadFromIndex);

        cc.assert(fromIndex >= 0 || fromIndex < this._totalQuads, cc._LogInfos.TextureAtlas_insertQuadFromIndex_2);

        var quadSize = cc.V3F_C4B_T2F_Quad.BYTES_PER_ELEMENT;
        var locQuadsReader = this._quadsReader;
        var sourceArr = locQuadsReader.subarray(fromIndex * quadSize, quadSize);
        var startOffset, moveLength;
        if (fromIndex > newIndex) {
            startOffset = newIndex * quadSize;
            moveLength = (fromIndex - newIndex) * quadSize;
            locQuadsReader.set(locQuadsReader.subarray(startOffset, startOffset + moveLength), startOffset + quadSize);
            locQuadsReader.set(sourceArr, startOffset);
        } else {
            startOffset = (fromIndex + 1) * quadSize;
            moveLength = (newIndex - fromIndex) * quadSize;
            locQuadsReader.set(locQuadsReader.subarray(startOffset, startOffset + moveLength), startOffset - quadSize);
            locQuadsReader.set(sourceArr, newIndex * quadSize);
        }
        this.dirty = true;
    },

    /**
     * <p>Removes a quad at a given index number. 删除一个给定index的quad <br />
     * The capacity remains the same, but the total number of quads to be drawn is reduced in 1 贴图集的大小不变，但是绘制的quads数量减了1 </p>
     * @param {Number} index
     */
    removeQuadAtIndex: function (index) {
        cc.assert(index < this._totalQuads, cc._LogInfos.TextureAtlas_removeQuadAtIndex);

        var quadSize = cc.V3F_C4B_T2F_Quad.BYTES_PER_ELEMENT;
        this._totalQuads--;
        this._quads.length = this._totalQuads;
        if (index !== this._totalQuads) {
            //move data
            var startOffset = (index + 1) * quadSize;
            var moveLength = (this._totalQuads - index) * quadSize;
            this._quadsReader.set(this._quadsReader.subarray(startOffset, startOffset + moveLength), startOffset - quadSize);
        }
        this.dirty = true;
    },

    /**
     * Removes a given number of quads at a given index 从给定的index开始删除给定数量的quads
     * @param {Number} index
     * @param {Number} amount
     */
    removeQuadsAtIndex: function (index, amount) {
        cc.assert(index + amount <= this._totalQuads, cc._LogInfos.TextureAtlas_removeQuadsAtIndex);

        this._totalQuads -= amount;

        if (index !== this._totalQuads) {
            //move data
            var quadSize = cc.V3F_C4B_T2F_Quad.BYTES_PER_ELEMENT;
            var srcOffset = (index + amount) * quadSize;
            var moveLength = (this._totalQuads - index) * quadSize;
            var dstOffset = index * quadSize;
            this._quadsReader.set(this._quadsReader.subarray(srcOffset, srcOffset + moveLength), dstOffset);
        }
        this.dirty = true;
    },

    /**
     * <p>Removes all Quads. 删除所有Quads。<br />
     * The TextureAtlas capacity remains untouched. No memory is freed. TextureAtlas的占用空间不变。内存未被释放。<br />
     * The total number of quads to be drawn will be 0</p>
     */
    removeAllQuads: function () {
        this._quads.length = 0;
        this._totalQuads = 0;
    },

    _setDirty: function (dirty) {
        this.dirty = dirty;
    },

    /**
     * <p>Resize the capacity of the CCTextureAtlas. 重定义CCTextureAtlas的占用空间。<br />
     * The new capacity can be lower or higher than the current one 新的空间大小可以比当前的低或者高 <br />
     * It returns YES if the resize was successful. 成功返回YES <br />
     * If it fails to resize the capacity it will return NO with a new capacity of 0. 失败返回NO, 并且占用空间被置为0。<br />
     * no used for js</p>
     * @param {Number} newCapacity
     * @return {Boolean}
     */
    resizeCapacity: function (newCapacity) {
        if (newCapacity == this._capacity)
            return true;

        var quadSize = cc.V3F_C4B_T2F_Quad.BYTES_PER_ELEMENT;
        var oldCapacity = this._capacity;
        // update capacity and totolQuads
        this._totalQuads = Math.min(this._totalQuads, newCapacity);
        this._capacity = 0 | newCapacity;
        var i, capacity = this._capacity, locTotalQuads = this._totalQuads;

        if (this._quads == null) {
            this._quads = [];
            this._quadsArrayBuffer = new ArrayBuffer(quadSize * capacity);
            this._quadsReader = new Uint8Array(this._quadsArrayBuffer);
            for (i = 0; i < capacity; i++)
                this._quads = new cc.V3F_C4B_T2F_Quad(null, null, null, null, this._quadsArrayBuffer, i * quadSize);
        } else {
            var newQuads, newArrayBuffer, quads = this._quads;
            if (capacity > oldCapacity) {
                newQuads = [];
                newArrayBuffer = new ArrayBuffer(quadSize * capacity);
                for (i = 0; i < locTotalQuads; i++) {
                    newQuads[i] = new cc.V3F_C4B_T2F_Quad(quads[i].tl, quads[i].bl, quads[i].tr, quads[i].br,
                        newArrayBuffer, i * quadSize);
                }
                for (; i < capacity; i++)
                    newQuads[i] = new cc.V3F_C4B_T2F_Quad(null, null, null, null, newArrayBuffer, i * quadSize);

                this._quadsReader = new Uint8Array(newArrayBuffer);
                this._quads = newQuads;
                this._quadsArrayBuffer = newArrayBuffer;
            } else {
                var count = Math.max(locTotalQuads, capacity);
                newQuads = [];
                newArrayBuffer = new ArrayBuffer(quadSize * capacity);
                for (i = 0; i < count; i++) {
                    newQuads[i] = new cc.V3F_C4B_T2F_Quad(quads[i].tl, quads[i].bl, quads[i].tr, quads[i].br,
                        newArrayBuffer, i * quadSize);
                }
                this._quadsReader = new Uint8Array(newArrayBuffer);
                this._quads = newQuads;
                this._quadsArrayBuffer = newArrayBuffer;
            }
        }

        if (this._indices == null) {
            this._indices = new Uint16Array(capacity * 6);
        } else {
            if (capacity > oldCapacity) {
                var tempIndices = new Uint16Array(capacity * 6);
                tempIndices.set(this._indices, 0);
                this._indices = tempIndices;
            } else {
                this._indices = this._indices.subarray(0, capacity * 6);
            }
        }

        this._setupIndices();
        this._mapBuffers();
        this.dirty = true;
        return true;
    },

    /**
     * Used internally by CCParticleBatchNode      CCParticleBatchNode内部使用                              <br/>
     * don't use this unless you know what you're doing 不要使用这个方法除非你真正了解
     * @param {Number} amount
     */
    increaseTotalQuadsWith: function (amount) {
        this._totalQuads += amount;
    },

    /**
     * Moves an amount of quads from oldIndex at newIndex 把一定数量的quads从旧的index移动到新的index
     * @param {Number} oldIndex
     * @param {Number} amount
     * @param {Number} newIndex
     */
    moveQuadsFromIndex: function (oldIndex, amount, newIndex) {
        if (newIndex === undefined) {
            newIndex = amount;
            amount = this._totalQuads - oldIndex;

            cc.assert((newIndex + (this._totalQuads - oldIndex)) <= this._capacity, cc._LogInfos.TextureAtlas_moveQuadsFromIndex);

            if (amount === 0)
                return;
        } else {
            cc.assert((newIndex + amount) <= this._totalQuads, cc._LogInfos.TextureAtlas_moveQuadsFromIndex_2);
            cc.assert(oldIndex < this._totalQuads, cc._LogInfos.TextureAtlas_moveQuadsFromIndex_3);

            if (oldIndex == newIndex)
                return;
        }

        var quadSize = cc.V3F_C4B_T2F_Quad.BYTES_PER_ELEMENT;
        var srcOffset = oldIndex * quadSize;
        var srcLength = amount * quadSize;
        var locQuadsReader = this._quadsReader;
        var sourceArr = locQuadsReader.subarray(srcOffset, srcOffset + srcLength);
        var dstOffset = newIndex * quadSize;
        var moveLength, moveStart;
        if (newIndex < oldIndex) {
            moveLength = (oldIndex - newIndex) * quadSize;
            moveStart = newIndex * quadSize;
            locQuadsReader.set(locQuadsReader.subarray(moveStart, moveStart + moveLength), moveStart + srcLength)
        } else {
            moveLength = (newIndex - oldIndex) * quadSize;
            moveStart = (oldIndex + amount) * quadSize;
            locQuadsReader.set(locQuadsReader.subarray(moveStart, moveStart + moveLength), srcOffset);
        }
        locQuadsReader.set(sourceArr, dstOffset);
        this.dirty = true;
    },

    /**
     * Ensures that after a realloc quads are still empty   确保重新初始化后,quads是空的                             <br/>
     * Used internally by CCParticleBatchNode CCParticleBatchNode 内部使用
     * @param {Number} index
     * @param {Number} amount
     */
    fillWithEmptyQuadsFromIndex: function (index, amount) {
        var count = amount * cc.V3F_C4B_T2F_Quad.BYTES_PER_ELEMENT;
        var clearReader = new Uint8Array(this._quadsArrayBuffer, index * cc.V3F_C4B_T2F_Quad.BYTES_PER_ELEMENT, count);
        for (var i = 0; i < count; i++)
            clearReader[i] = 0;
    },

    // TextureAtlas - Drawing

    /**
     * Draws all the Atlas's Quads
     */
    drawQuads: function () {
        this.drawNumberOfQuads(this._totalQuads, 0);
    },

    _releaseBuffer: function () {
        var gl = cc._renderContext;
        if (this._buffersVBO) {
            if (this._buffersVBO[0])
                gl.deleteBuffer(this._buffersVBO[0]);
            if (this._buffersVBO[1])
                gl.deleteBuffer(this._buffersVBO[1])
        }
        if (this._quadsWebBuffer)
            gl.deleteBuffer(this._quadsWebBuffer);
    }
});

var _p = cc.TextureAtlas.prototype;

// Extended properties
/** @expose */
_p.totalQuads;
cc.defineGetterSetter(_p, "totalQuads", _p.getTotalQuads);
/** @expose */
_p.capacity;
cc.defineGetterSetter(_p, "capacity", _p.getCapacity);
/** @expose */
_p.quads;
cc.defineGetterSetter(_p, "quads", _p.getQuads, _p.setQuads);

/**
 * <p>Creates a TextureAtlas with an filename and with an initial capacity for Quads. <br /
 * 通过文件名和初始化Quads大小创建 TextureAtlas
 * The TextureAtlas capacity can be increased in runtime. </p>
 * TexttureAtlas的占用空间大小可以在运行时增加。
 * @deprecated since v3.0, please use new cc.TextureAtlas(fileName, capacity) instead
 * @此函数从 v3.0已弃用，请使用新接口 cc.TextureAtlas(fileName, capacity)
 * @param {String|cc.Texture2D} fileName
 * @param {Number} capacity
 * @return {cc.TextureAtlas|Null}
 */
cc.TextureAtlas.create = function (fileName, capacity) {
    return new cc.TextureAtlas(fileName, capacity);
};

/**
 * @deprecated  since v3.0, please use new cc.TextureAtlas(texture) instead
 * @此函数从 v3.0已弃用，请使用新接口 cc.TextureAtlas(texture)
 * @function
 */
cc.TextureAtlas.createWithTexture = cc.TextureAtlas.create;

if (cc._renderType === cc._RENDER_TYPE_WEBGL) {
    cc.assert(cc.isFunction(cc._tmp.WebGLTextureAtlas), cc._LogInfos.MissingFile, "TexturesWebGL.js");
    cc._tmp.WebGLTextureAtlas();
    delete cc._tmp.WebGLTextureAtlas;
}

cc.assert(cc.isFunction(cc._tmp.PrototypeTextureAtlas), cc._LogInfos.MissingFile, "TexturesPropertyDefine.js");
cc._tmp.PrototypeTextureAtlas();
delete cc._tmp.PrototypeTextureAtlas;
