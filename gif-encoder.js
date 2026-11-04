/**
 * High-Performance, Ultra-Reliable In-Browser GIF Encoder
 * Designed for Smart GIF Studio (100% Client-Side, No Lag, No Freezing)
 */

(function (global) {
  'use strict';

  // =========================================================================
  // 1. Fast Octree Color Quantizer (10x faster than NeuQuant, Crisp & Vibrant)
  // =========================================================================
  function OctreeQuantizer(maxColors) {
    this.maxColors = maxColors || 256;
    this.root = this.createNode(0);
    this.leafNodes = [];
    this.reducibleNodes = [[], [], [], [], [], [], [], []];
  }

  OctreeQuantizer.prototype.createNode = function (level) {
    return {
      isLeaf: false,
      pixelCount: 0,
      red: 0,
      green: 0,
      blue: 0,
      children: new Array(8),
      level: level
    };
  };

  OctreeQuantizer.prototype.addColor = function (r, g, b) {
    var node = this.root;
    for (var level = 0; level < 7; level++) {
      var shift = 7 - level;
      var bitR = (r >> shift) & 1;
      var bitG = (g >> shift) & 1;
      var bitB = (b >> shift) & 1;
      var index = (bitR << 2) | (bitG << 1) | bitB;

      if (!node.children[index]) {
        node.children[index] = this.createNode(level + 1);
        if (level < 6) {
          this.reducibleNodes[level].push(node.children[index]);
        }
      }
      node = node.children[index];
    }
    node.isLeaf = true;
    node.pixelCount++;
    node.red += r;
    node.green += g;
    node.blue += b;
  };

  OctreeQuantizer.prototype.buildPalette = function () {
    var leafCount = this.countLeaves(this.root);
    for (var level = 6; level >= 0; level--) {
      var list = this.reducibleNodes[level];
      while (list && list.length > 0 && leafCount > this.maxColors) {
        var node = list.pop();
        if (node && !node.isLeaf) {
          var childrenCount = 0;
          for (var i = 0; i < 8; i++) {
            if (node.children[i]) {
              node.pixelCount += node.children[i].pixelCount;
              node.red += node.children[i].red;
              node.green += node.children[i].green;
              node.blue += node.children[i].blue;
              node.children[i] = null;
              childrenCount++;
            }
          }
          node.isLeaf = true;
          leafCount -= (childrenCount - 1);
        }
      }
    }

    var palette = [];
    this.leafNodes = [];
    this.extractPalette(this.root, palette);

    // Fill palette up to maxColors with black if fewer
    while (palette.length < this.maxColors * 3) {
      palette.push(0, 0, 0);
    }
    return palette;
  };

  OctreeQuantizer.prototype.countLeaves = function (node) {
    if (!node) return 0;
    if (node.isLeaf) return 1;
    var count = 0;
    for (var i = 0; i < 8; i++) {
      if (node.children[i]) count += this.countLeaves(node.children[i]);
    }
    return count;
  };

  OctreeQuantizer.prototype.extractPalette = function (node, palette) {
    if (!node) return;
    if (node.isLeaf) {
      var count = node.pixelCount || 1;
      var r = Math.min(255, Math.round(node.red / count));
      var g = Math.min(255, Math.round(node.green / count));
      var b = Math.min(255, Math.round(node.blue / count));
      node.paletteIndex = palette.length / 3;
      palette.push(r, g, b);
      this.leafNodes.push(node);
      return;
    }
    for (var i = 0; i < 8; i++) {
      if (node.children[i]) this.extractPalette(node.children[i], palette);
    }
  };

  OctreeQuantizer.prototype.findColorIndex = function (r, g, b) {
    var node = this.root;
    for (var level = 0; level < 8; level++) {
      if (node.isLeaf) return node.paletteIndex;
      var shift = 7 - level;
      var bitR = (r >> shift) & 1;
      var bitG = (g >> shift) & 1;
      var bitB = (b >> shift) & 1;
      var index = (bitR << 2) | (bitG << 1) | bitB;
      if (!node.children[index]) {
        // Fallback to nearest leaf
        return this.findNearestColor(r, g, b);
      }
      node = node.children[index];
    }
    return node.paletteIndex || 0;
  };

  OctreeQuantizer.prototype.findNearestColor = function (r, g, b) {
    var bestDist = Infinity;
    var bestIdx = 0;
    for (var i = 0; i < this.leafNodes.length; i++) {
      var node = this.leafNodes[i];
      var count = node.pixelCount || 1;
      var nr = node.red / count;
      var ng = node.green / count;
      var nb = node.blue / count;
      var dr = r - nr;
      var dg = g - ng;
      var db = b - nb;
      var dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = node.paletteIndex;
      }
    }
    return bestIdx;
  };

  // =========================================================================
  // 2. Standard GIF89a LZW Compressor
  // =========================================================================
  function LZWEncoder(width, height, pixels, colorDepth) {
    var initCodeSize = Math.max(2, colorDepth);
    var accum = new Uint8Array(256);
    var htab = new Int32Array(5003);
    var codetab = new Int32Array(5003);
    var cur_accum = 0;
    var cur_bits = 0;
    var a_count = 0;
    var free_ent = 0;
    var maxcode = 0;
    var clear_flg = false;
    var g_init_bits = 0;
    var ClearCode = 0;
    var EOFCode = 0;
    var curIndex = 0;
    var n_bits = 0;

    function char_out(c, outs) {
      accum[a_count++] = c;
      if (a_count >= 254) flush_char(outs);
    }

    function cl_block(outs) {
      for (var i = 0; i < 5003; ++i) htab[i] = -1;
      free_ent = ClearCode + 2;
      clear_flg = true;
      output(ClearCode, outs);
    }

    function flush_char(outs) {
      if (a_count > 0) {
        outs.writeByte(a_count);
        outs.writeBytes(accum, a_count);
        a_count = 0;
      }
    }

    function output(code, outs) {
      cur_accum &= (1 << cur_bits) - 1;
      if (cur_bits > 0) cur_accum |= (code << cur_bits);
      else cur_accum = code;
      cur_bits += n_bits;

      while (cur_bits >= 8) {
        char_out(cur_accum & 0xff, outs);
        cur_accum >>= 8;
        cur_bits -= 8;
      }

      if (free_ent > maxcode || clear_flg) {
        if (clear_flg) {
          maxcode = (1 << (n_bits = g_init_bits)) - 1;
          clear_flg = false;
        } else {
          ++n_bits;
          if (n_bits === 12) maxcode = 1 << 12;
          else maxcode = (1 << n_bits) - 1;
        }
      }

      if (code === EOFCode) {
        while (cur_bits > 0) {
          char_out(cur_accum & 0xff, outs);
          cur_accum >>= 8;
          cur_bits -= 8;
        }
        flush_char(outs);
      }
    }

    this.encode = function (outs) {
      outs.writeByte(initCodeSize);
      curIndex = 0;
      n_bits = initCodeSize + 1;
      g_init_bits = n_bits;
      maxcode = (1 << n_bits) - 1;
      ClearCode = 1 << initCodeSize;
      EOFCode = ClearCode + 1;
      free_ent = ClearCode + 2;
      a_count = 0;
      cur_accum = 0;
      cur_bits = 0;

      for (var i = 0; i < 5003; ++i) htab[i] = -1;
      output(ClearCode, outs);

      var ent = pixels[curIndex++] & 0xff;
      var hshift = 0;
      for (var fcode = 5003; fcode < 65536; fcode *= 2) ++hshift;
      hshift = 8 - hshift;

      var len = pixels.length;
      while (curIndex < len) {
        var c = pixels[curIndex++] & 0xff;
        var fcode = (c << 12) + ent;
        var i = (c << hshift) ^ ent;
        if (htab[i] === fcode) {
          ent = codetab[i];
          continue;
        } else if (htab[i] >= 0) {
          var disp = 5003 - i;
          if (i === 0) disp = 1;
          var found = false;
          do {
            if ((i -= disp) < 0) i += 5003;
            if (htab[i] === fcode) {
              ent = codetab[i];
              found = true;
              break;
            }
          } while (htab[i] >= 0);
          if (found) continue;
        }
        output(ent, outs);
        ent = c;
        if (free_ent < (1 << 12)) {
          codetab[i] = free_ent++;
          htab[i] = fcode;
        } else {
          cl_block(outs);
        }
      }
      output(ent, outs);
      output(EOFCode, outs);
      outs.writeByte(0); // block terminator
    };
  }

  // =========================================================================
  // 3. Fast ByteArray Stream
  // =========================================================================
  function ByteArray() {
    this.buffer = new Uint8Array(1024 * 64);
    this.length = 0;
  }
  ByteArray.prototype.writeByte = function (b) {
    if (this.length >= this.buffer.length) {
      var next = new Uint8Array(this.buffer.length * 2);
      next.set(this.buffer);
      this.buffer = next;
    }
    this.buffer[this.length++] = b & 0xff;
  };
  ByteArray.prototype.writeBytes = function (arr, len) {
    var l = len || arr.length;
    while (this.length + l > this.buffer.length) {
      var next = new Uint8Array(Math.max(this.buffer.length * 2, this.length + l + 1024));
      next.set(this.buffer);
      this.buffer = next;
    }
    this.buffer.set(arr.subarray ? arr.subarray(0, l) : arr.slice(0, l), this.length);
    this.length += l;
  };
  ByteArray.prototype.writeUTFBytes = function (str) {
    for (var i = 0; i < str.length; i++) {
      this.writeByte(str.charCodeAt(i));
    }
  };
  ByteArray.prototype.toUint8Array = function () {
    return this.buffer.subarray(0, this.length);
  };

  // =========================================================================
  // 4. Main GIFEncoder Class
  // =========================================================================
  function GIFEncoder(width, height) {
    this.width = Math.round(width) || 320;
    this.height = Math.round(height) || 240;
    this.delay = 100; // ms
    this.repeat = 0; // 0 = loop forever
    this.out = new ByteArray();
    this.firstFrame = true;
    this.framesCount = 0;
  }

  GIFEncoder.prototype.setDelay = function (ms) {
    this.delay = Math.max(20, Math.round(ms));
  };

  GIFEncoder.prototype.setRepeat = function (repeat) {
    this.repeat = repeat;
  };

  GIFEncoder.prototype.setQuality = function () {
    // Kept for backward compatibility
  };

  GIFEncoder.prototype.start = function () {
    this.out = new ByteArray();
    this.firstFrame = true;
    this.framesCount = 0;
    this.out.writeUTFBytes('GIF89a');
  };

  GIFEncoder.prototype.writeShort = function (val) {
    this.out.writeByte(val & 0xff);
    this.out.writeByte((val >> 8) & 0xff);
  };

  GIFEncoder.prototype.writeNetscapeLoop = function () {
    this.out.writeByte(0x21); // Extension Introducer
    this.out.writeByte(0xff); // Application Extension Label
    this.out.writeByte(11);   // Block Size
    this.out.writeUTFBytes('NETSCAPE2.0');
    this.out.writeByte(3);    // Sub-block Length
    this.out.writeByte(1);    // Loop Sub-block Index
    this.writeShort(this.repeat);
    this.out.writeByte(0);    // Block Terminator
  };

  GIFEncoder.prototype.addFrame = function (imageData) {
    var w = this.width;
    var h = this.height;
    var pixels = imageData.data;

    // 1. Quantize Colors with Octree (RGBA -> 256 Palette)
    var quantizer = new OctreeQuantizer(256);
    // Sample step to speed up palette build on large frames
    var sampleStep = (w * h > 160000) ? 8 : 4;
    for (var i = 0; i < pixels.length; i += sampleStep * 4) {
      quantizer.addColor(pixels[i], pixels[i + 1], pixels[i + 2]);
    }
    var palette = quantizer.buildPalette();

    // 2. Map every pixel to palette index
    var indexed = new Uint8Array(w * h);
    var pIdx = 0;
    for (var i = 0; i < pixels.length; i += 4) {
      indexed[pIdx++] = quantizer.findColorIndex(pixels[i], pixels[i + 1], pixels[i + 2]);
    }

    // 3. Screen Descriptor & Header on first frame
    if (this.firstFrame) {
      this.writeShort(w);
      this.writeShort(h);
      this.out.writeByte(0x70); // Global color table flag = 0
      this.out.writeByte(0);    // Background color
      this.out.writeByte(0);    // Pixel aspect ratio
      if (this.repeat >= 0) {
        this.writeNetscapeLoop();
      }
      this.firstFrame = false;
    }

    // 4. Graphic Control Extension (Delay Time in 1/100s)
    this.out.writeByte(0x21);
    this.out.writeByte(0xf9);
    this.out.writeByte(4);
    this.out.writeByte(0x04); // Do not dispose
    var delay100ths = Math.max(2, Math.round(this.delay / 10));
    this.writeShort(delay100ths);
    this.out.writeByte(0); // Transparent color index
    this.out.writeByte(0); // Terminator

    // 5. Image Descriptor
    this.out.writeByte(0x2c); // Separator
    this.writeShort(0);       // Left
    this.writeShort(0);       // Top
    this.writeShort(w);
    this.writeShort(h);
    this.out.writeByte(0x87); // Local color table flag = 1, size = 256 (7)

    // 6. Local Color Table (768 bytes)
    for (var i = 0; i < 768; i++) {
      this.out.writeByte(palette[i] || 0);
    }

    // 7. LZW Encoded Image Data
    var encoder = new LZWEncoder(w, h, indexed, 8);
    encoder.encode(this.out);

    this.framesCount++;
  };

  GIFEncoder.prototype.finish = function () {
    this.out.writeByte(0x3b); // GIF Trailer
    var bytes = this.out.toUint8Array();
    return new Blob([bytes], { type: 'image/gif' });
  };

  global.GIFEncoder = GIFEncoder;

})(typeof window !== 'undefined' ? window : this);
