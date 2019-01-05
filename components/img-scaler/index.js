let id = 0;

function getCvsId() {
  id += 1;
  return `imgCompressor${id}`;
}

Component({
  properties: {
    path: {
      type: String,
      value: '',
      observer(nV) {
        if (nV) {
          this.updatePath(nV);
        }
      },
    },
    maxWidth: {
      type: Number,
      value: 500,
    },
    maxHeight: {
      type: Number,
      value: 1000,
    },
    maxSize: {
      type: Number,
      value: 0,
    },
    canvasId: {
      type: String,
      value: getCvsId(),
    },
    quality: {
      type: Number,
      value: 1,
    },
    fileType: {
      type: String,
      value: 'jpg',
    },
  },
  data: {
    width: 0,
    height: 0,
  },
  ready() {
    this.ctx = wx.createCanvasContext(this.data.canvasId, this);
  },
  methods: {
    /**
     * 路径更新
     */
    updatePath(newPath) {
      const that = this;

      wx.getImageInfo({
        src: newPath,
        success(r1) {
          wx.getFileInfo({
            filePath: newPath,
            success(r2) {
              const { width, height } = r1;
              const {
                maxWidth, maxHeight, maxSize,
              } = that.data;
              const ratio = width / height;
              let w = width;
              let h = height;
              if (maxSize && r2.size <= maxSize) {
                that.finish(newPath);
                return;
              }
              if (w > maxWidth) {
                w = maxWidth;
                h = maxWidth / ratio;
              }
              if (h > maxHeight) {
                h = maxHeight;
                w = maxHeight * ratio;
              }
              that.setData({
                width: w,
                height: h,
              }, () => {
                that.drawImg();
              });
            },
            fail(err) {
              that.fail(err, 'getFileInfo');
            },
          });
        },
        fail(err) {
          that.fail(err, 'getImageInfo');
        },
      });
    },
    /**
     * 绘制图片
     */
    drawImg() {
      const that = this;
      const { ctx } = this;
      const { path, width, height } = this.data;
      ctx.drawImage(path, 0, 0, width, height);
      ctx.draw();
      setTimeout(() => {
        that.save();
      }, 500);
    },
    /**
     * 导出图片
     */
    save() {
      const that = this;
      const {
        width, height, canvasId, quality, fileType,
      } = this.data;
      wx.canvasToTempFilePath({
        canvasId,
        destWidth: width,
        destHeight: height,
        fileType,
        quality,
        success(res) {
          const path = res.tempFilePath;
          that.finish(path);
        },
        fail(err) {
          that.fail(err, 'canvasToTempFilePath');
        },
      }, this);
    },
    /**
     * 完成
     */
    finish(path) {
      this.triggerEvent('finish', { value: path });
    },
    /**
     * 错误
     */
    fail(err, type) {
      this.triggerEvent('error', { err, type });
    },
  },
});
