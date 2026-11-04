/**
 * Smart GIF Studio - Cinematic Motion & Film Lab
 * Core Application Engine with Drag & Drop Overlays & IndexedDB History
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ==========================================
  // 1. DOM Elements
  // ==========================================
  const dropzoneWrapper = document.getElementById('dropzoneWrapper');
  const dropzone = document.getElementById('dropzone');
  const videoFileInput = document.getElementById('videoFileInput');
  const browseBtn = document.getElementById('browseBtn');

  // Real Sample Buttons
  const sampleItemButtons = document.querySelectorAll('.sample-item-btn');

  // Modal
  const formatErrorModal = document.getElementById('formatErrorModal');
  const modalErrorMsg = document.getElementById('modalErrorMsg');
  const btnModalClose = document.getElementById('btnModalClose');

  // Workspace & Stage
  const editorWorkspace = document.getElementById('editorWorkspace');
  const previewVideo = document.getElementById('previewVideo');
  const stageWrapper = document.getElementById('stageWrapper');
  const cropOverlayBox = document.getElementById('cropOverlayBox');
  const cropTagLabel = document.getElementById('cropTagLabel');
  const liveCaption = document.getElementById('liveCaption');
  const liveSticker = document.getElementById('liveSticker');

  // Controls & Metadata
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const videoTimeline = document.getElementById('videoTimeline');
  const videoTimeDisplay = document.getElementById('videoTimeDisplay');

  const metaFileName = document.getElementById('metaFileName');
  const metaFileSize = document.getElementById('metaFileSize');
  const metaResolution = document.getElementById('metaResolution');
  const metaDuration = document.getElementById('metaDuration');

  // Tabs
  const studioTabs = document.querySelectorAll('.studio-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Trim
  const trimStartTime = document.getElementById('trimStartTime');
  const trimEndTime = document.getElementById('trimEndTime');
  const btnSetStartCurrent = document.getElementById('btnSetStartCurrent');
  const btnSetEndCurrent = document.getElementById('btnSetEndCurrent');
  const trimSelectedDuration = document.getElementById('trimSelectedDuration');

  // Crop & Resize
  const cropButtons = document.querySelectorAll('.crop-btn');
  const scaleButtons = document.querySelectorAll('.scale-btn');
  const targetWidthInput = document.getElementById('targetWidth');
  const targetHeightInput = document.getElementById('targetHeight');
  const lockAspectRatio = document.getElementById('lockAspectRatio');

  // Speed & FPS (Max 30 FPS Limit)
  const speedButtons = document.querySelectorAll('.speed-btn');
  const speedDisplay = document.getElementById('speedDisplay');
  const fpsRange = document.getElementById('fpsRange');
  const fpsDisplay = document.getElementById('fpsDisplay');
  const estimatedFramesText = document.getElementById('estimatedFramesText');

  // Compression
  const dropFramesCheck = document.getElementById('dropFramesCheck');

  // Caption & Fonts
  const captionInput = document.getElementById('captionInput');
  const captionFontSize = document.getElementById('captionFontSize');
  const captionColor = document.getElementById('captionColor');
  const fontPickButtons = document.querySelectorAll('.font-pick-btn');

  // Sticker
  const stickerGrid = document.getElementById('stickerGrid');
  const btnClearSticker = document.getElementById('btnClearSticker');

  // Filter
  const filterButtons = document.querySelectorAll('.filter-btn');

  // Action Bar & Progress & Download
  const btnStartConvert = document.getElementById('btnStartConvert');
  const btnConvertText = document.getElementById('btnConvertText');
  const statusSpinner = document.getElementById('statusSpinner');
  const statusMessage = document.getElementById('statusMessage');
  const progressPercent = document.getElementById('progressPercent');
  const progressBarFill = document.getElementById('progressBarFill');
  const btnDownload = document.getElementById('btnDownload');
  const downloadBtnLabel = document.getElementById('downloadBtnLabel');

  // Thumbnails Strip
  const thumbnailsContainer = document.getElementById('thumbnailsContainer');
  const thumbPlaceholder = document.getElementById('thumbPlaceholder');
  const framesCountBadge = document.getElementById('framesCountBadge');

  // Result Card
  const resultPreviewCard = document.getElementById('resultPreviewCard');
  const resultGifImg = document.getElementById('resultGifImg');
  const resultFilenameText = document.getElementById('resultFilenameText');
  const resultFilesizeText = document.getElementById('resultFilesizeText');
  const resultResolutionText = document.getElementById('resultResolutionText');
  const resultFramesCountText = document.getElementById('resultFramesCountText');

  // History Elements
  const historyGrid = document.getElementById('historyGrid');
  const historyEmpty = document.getElementById('historyEmpty');
  const historyCountBadge = document.getElementById('historyCountBadge');
  const btnClearAllHistory = document.getElementById('btnClearAllHistory');

  // Offscreen Canvas
  const captureCanvas = document.getElementById('captureCanvas');
  const captureCtx = captureCanvas.getContext('2d', { willReadFrequently: true });

  const SUPPORTED_EXTS = ['mp4', 'mov', 'webm', 'avi', 'mkv', 'flv', 'wmv', 'm4v', '3gp', 'ogv', 'ts'];

  // ==========================================
  // 2. Application State
  // ==========================================
  let currentFile = null;
  let videoDuration = 0;
  let originalWidth = 0;
  let originalHeight = 0;
  let videoAspect = 16 / 9;
  let isConverting = false;
  let downloadFileName = 'cinematic_motion.gif';
  let generatedGifBlob = null;
  let generatedGifUrl = null;

  // Options State
  let currentCropRatio = 'none';
  let currentSpeed = 1.0;
  let currentFontFamily = 'Pretendard, sans-serif';
  let selectedSticker = '';
  let currentFilter = 'none';

  // Drag coordinates normalized (0.0 to 1.0 of stage dimension)
  let captionNormX = 0.5;   // Center horizontally
  let captionNormY = 0.85;  // Near bottom
  let stickerNormX = 0.85;  // Top-right
  let stickerNormY = 0.15;

  previewVideo.muted = true;
  previewVideo.playsInline = true;

  // ==========================================
  // 3. Tab Switching
  // ==========================================
  studioTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPaneId = tab.dataset.tab;
      studioTabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const pane = document.getElementById(targetPaneId);
      if (pane) pane.classList.add('active');

      if (targetPaneId === 'pane-crop' && currentCropRatio !== 'none') {
        cropOverlayBox.classList.add('active');
      } else {
        cropOverlayBox.classList.remove('active');
      }
    });
  });

  // ==========================================
  // 4. Real Nature & Wildlife Sample Videos (실제 실사 영상)
  // ==========================================
  sampleItemButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const filePath = btn.dataset.sampleFile;
      if (!filePath) return;

      btn.style.opacity = '0.6';
      btn.style.pointerEvents = 'none';
      const actionTextEl = btn.querySelector('.sample-btn-action');
      const origText = actionTextEl.textContent;
      actionTextEl.textContent = '실제 영상 불러오는 중... 🎬';

      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error('샘플 비디오 파일을 로드할 수 없습니다: ' + response.statusText);
        }
        const blob = await response.blob();
        const fileName = filePath.split('/').pop() || 'sample_nature.mp4';
        const file = new File([blob], fileName, { type: blob.type || 'video/mp4' });
        processFile(file);
      } catch (err) {
        console.error('Sample fetch failed:', err);
        alert('샘플 영상을 불러오지 못했습니다. ' + err.message);
      } finally {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        actionTextEl.textContent = origText;
      }
    });
  });

  // ==========================================
  // 5. File Upload Handling
  // ==========================================
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return (mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs);
  }

  function getFileExtension(filename) {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
  }

  function getBaseNameWithoutExt(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? filename : filename.substring(0, lastDot);
  }

  function showFormatError(filename) {
    modalErrorMsg.innerHTML = `선택하신 파일 <strong>"${filename}"</strong> 은(는) 지원되지 않는 동영상 형식입니다.<br>MP4, WebM, MOV 등의 파일을 업로드해 주세요.`;
    formatErrorModal.classList.add('active');
  }

  btnModalClose.addEventListener('click', () => formatErrorModal.classList.remove('active'));

  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    videoFileInput.click();
  });
  dropzone.addEventListener('click', () => videoFileInput.click());

  ['dragenter', 'dragover'].forEach(ev => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(ev => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      alert('동영상 파일은 한 번에 1개만 업로드할 수 있습니다.');
    }
    processFile(files[0]);
  });

  videoFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  });

  function processFile(file) {
    const ext = getFileExtension(file.name);
    if (!SUPPORTED_EXTS.includes(ext) && !file.type.startsWith('video/')) {
      showFormatError(file.name);
      return;
    }

    currentFile = file;
    // 원래파일명.gif 형식으로 다운로드 지정
    downloadFileName = `${getBaseNameWithoutExt(file.name)}.gif`;

    metaFileName.textContent = file.name;
    metaFileSize.textContent = formatBytes(file.size);

    const objectUrl = URL.createObjectURL(file);
    previewVideo.src = objectUrl;
    previewVideo.load();

    resetState();
    editorWorkspace.classList.remove('hidden');
    editorWorkspace.scrollIntoView({ behavior: 'smooth' });
  }

  function resetState() {
    isConverting = false;
    generatedGifBlob = null;
    if (generatedGifUrl) {
      URL.revokeObjectURL(generatedGifUrl);
      generatedGifUrl = null;
    }
    btnStartConvert.disabled = false;
    btnConvertText.textContent = '🎞️ 감성 스마트 GIF로 변환하기';
    statusSpinner.classList.add('hidden');
    statusMessage.textContent = '준비 완료. 원하는 구간과 감성을 설정하고 변환하기를 누르세요.';
    progressPercent.textContent = '0%';
    progressBarFill.style.width = '0%';

    btnDownload.disabled = true;
    btnDownload.classList.remove('ready');
    downloadBtnLabel.textContent = `다운로드 (${downloadFileName})`;

    thumbnailsContainer.innerHTML = '';
    thumbnailsContainer.appendChild(thumbPlaceholder);
    thumbPlaceholder.style.display = 'flex';
    framesCountBadge.textContent = '추출 프레임: 0개';

    resultPreviewCard.classList.add('hidden');
  }

  previewVideo.addEventListener('loadedmetadata', () => {
    videoDuration = previewVideo.duration || 3.0;
    originalWidth = previewVideo.videoWidth || 640;
    originalHeight = previewVideo.videoHeight || 360;
    videoAspect = originalWidth / originalHeight;

    metaResolution.textContent = `${originalWidth} × ${originalHeight} px`;
    metaDuration.textContent = `${formatTime(videoDuration)} (${videoDuration.toFixed(1)}초)`;

    // Trim setup
    trimStartTime.value = '0.0';
    trimStartTime.max = Math.max(0, videoDuration - 0.1).toFixed(1);
    trimEndTime.value = Math.min(3.0, videoDuration).toFixed(1);
    trimEndTime.max = videoDuration.toFixed(1);
    updateTrimDuration();

    // Resize defaults
    let defW = originalWidth;
    let defH = originalHeight;
    if (defW > 480) {
      defW = 480;
      defH = Math.round(defW / videoAspect);
    }
    targetWidthInput.value = defW;
    targetHeightInput.value = defH;

    videoTimeline.max = videoDuration;
    videoTimeline.value = 0;
    updateTimeDisplay();
    updateEstimatedFrames();
    updateCropOverlayBox();
    updateStageOverlayPositions();

    previewVideo.play().then(() => {
      setTimeout(() => previewVideo.pause(), 100);
    }).catch(() => {});
  });

  // ==========================================
  // 6. Transport Controls (Playback)
  // ==========================================
  btnPlayPause.addEventListener('click', () => {
    if (previewVideo.paused || previewVideo.ended) {
      previewVideo.play();
      playPauseIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    } else {
      previewVideo.pause();
      playPauseIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    }
  });

  previewVideo.addEventListener('timeupdate', () => {
    if (!isConverting) {
      videoTimeline.value = previewVideo.currentTime;
      updateTimeDisplay();
    }
  });

  previewVideo.addEventListener('ended', () => {
    playPauseIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  });

  videoTimeline.addEventListener('input', () => {
    previewVideo.currentTime = parseFloat(videoTimeline.value);
    updateTimeDisplay();
  });

  function updateTimeDisplay() {
    videoTimeDisplay.textContent = `${formatTime(previewVideo.currentTime)} / ${formatTime(videoDuration)}`;
  }

  // ==========================================
  // 7. Trim Controls
  // ==========================================
  btnSetStartCurrent.addEventListener('click', () => {
    trimStartTime.value = previewVideo.currentTime.toFixed(1);
    validateTrim();
  });

  btnSetEndCurrent.addEventListener('click', () => {
    trimEndTime.value = previewVideo.currentTime.toFixed(1);
    validateTrim();
  });

  trimStartTime.addEventListener('change', validateTrim);
  trimEndTime.addEventListener('change', validateTrim);

  function validateTrim() {
    let s = parseFloat(trimStartTime.value) || 0;
    let e = parseFloat(trimEndTime.value) || 0;
    if (s < 0) s = 0;
    if (e > videoDuration && videoDuration > 0) e = videoDuration;
    if (s >= e) e = Math.min(videoDuration, s + 1.0);

    trimStartTime.value = s.toFixed(1);
    trimEndTime.value = e.toFixed(1);
    updateTrimDuration();
    updateEstimatedFrames();
  }

  function updateTrimDuration() {
    const s = parseFloat(trimStartTime.value) || 0;
    const e = parseFloat(trimEndTime.value) || 0;
    trimSelectedDuration.textContent = `${Math.max(0, e - s).toFixed(1)} 초`;
  }

  // ==========================================
  // 8. Crop Controls
  // ==========================================
  cropButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      cropButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCropRatio = btn.dataset.ratio;
      updateCropOverlayBox();
    });
  });

  function getCropSourceCoordinates() {
    if (currentCropRatio === 'none' || originalWidth <= 0 || originalHeight <= 0) {
      return { sx: 0, sy: 0, sw: originalWidth, sh: originalHeight };
    }
    let targetRatio = 1.0;
    if (currentCropRatio === '1:1') targetRatio = 1.0;
    else if (currentCropRatio === '16:9') targetRatio = 16 / 9;
    else if (currentCropRatio === '9:16') targetRatio = 9 / 16;
    else if (currentCropRatio === '4:3') targetRatio = 4 / 3;

    let sw = originalWidth;
    let sh = originalHeight;
    if (videoAspect > targetRatio) {
      sw = Math.round(originalHeight * targetRatio);
      sh = originalHeight;
    } else {
      sw = originalWidth;
      sh = Math.round(originalWidth / targetRatio);
    }
    const sx = Math.max(0, Math.round((originalWidth - sw) / 2));
    const sy = Math.max(0, Math.round((originalHeight - sh) / 2));
    return { sx, sy, sw, sh };
  }

  function updateCropOverlayBox() {
    if (currentCropRatio === 'none') {
      cropOverlayBox.classList.remove('active');
      return;
    }
    cropOverlayBox.classList.add('active');
    cropTagLabel.textContent = `Crop (${currentCropRatio})`;

    const rect = previewVideo.getBoundingClientRect();
    const stageRect = stageWrapper.getBoundingClientRect();

    const videoDispW = rect.width;
    const videoDispH = rect.height;
    const videoLeft = rect.left - stageRect.left;
    const videoTop = rect.top - stageRect.top;

    const { sx, sy, sw, sh } = getCropSourceCoordinates();
    const scaleX = videoDispW / originalWidth;
    const scaleY = videoDispH / originalHeight;

    cropOverlayBox.style.left = `${videoLeft + sx * scaleX}px`;
    cropOverlayBox.style.top = `${videoTop + sy * scaleY}px`;
    cropOverlayBox.style.width = `${sw * scaleX}px`;
    cropOverlayBox.style.height = `${sh * scaleY}px`;
  }

  window.addEventListener('resize', () => {
    if (editorWorkspace && !editorWorkspace.classList.contains('hidden')) {
      updateCropOverlayBox();
      updateStageOverlayPositions();
    }
  });

  // ==========================================
  // 9. Resize Controls
  // ==========================================
  scaleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const scale = parseFloat(btn.dataset.scale);
      if (originalWidth > 0 && originalHeight > 0) {
        const { sw, sh } = getCropSourceCoordinates();
        targetWidthInput.value = Math.round(sw * scale);
        targetHeightInput.value = Math.round(sh * scale);
        scaleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });

  targetWidthInput.addEventListener('input', () => {
    if (lockAspectRatio.checked) {
      const { sw, sh } = getCropSourceCoordinates();
      const ratio = sw / sh;
      const w = parseInt(targetWidthInput.value, 10);
      if (w > 0 && ratio > 0) {
        targetHeightInput.value = Math.round(w / ratio);
      }
    }
    scaleButtons.forEach(b => b.classList.remove('active'));
  });

  targetHeightInput.addEventListener('input', () => {
    if (lockAspectRatio.checked) {
      const { sw, sh } = getCropSourceCoordinates();
      const ratio = sw / sh;
      const h = parseInt(targetHeightInput.value, 10);
      if (h > 0 && ratio > 0) {
        targetWidthInput.value = Math.round(h * ratio);
      }
    }
    scaleButtons.forEach(b => b.classList.remove('active'));
  });

  // ==========================================
  // 10. Speed & FPS Controls (Max 30 FPS Enforced)
  // ==========================================
  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSpeed = parseFloat(btn.dataset.speed);
      speedDisplay.textContent = `${currentSpeed}x`;
      previewVideo.playbackRate = currentSpeed;
      updateEstimatedFrames();
    });
  });

  fpsRange.addEventListener('input', () => {
    let val = parseInt(fpsRange.value, 10);
    if (val > 30) val = 30;
    if (val < 1) val = 1;
    fpsRange.value = val;
    fpsDisplay.textContent = `${val} FPS`;
    updateEstimatedFrames();
  });

  function updateEstimatedFrames() {
    const s = parseFloat(trimStartTime.value) || 0;
    const e = parseFloat(trimEndTime.value) || 0;
    const dur = Math.max(0, e - s);
    const fps = parseInt(fpsRange.value, 10) || 15;
    let frames = Math.max(1, Math.round(dur * fps / currentSpeed));
    if (dropFramesCheck && dropFramesCheck.checked) {
      frames = Math.max(1, Math.round(frames / 2));
    }
    estimatedFramesText.textContent = `약 ${frames} 프레임`;
  }

  dropFramesCheck.addEventListener('change', updateEstimatedFrames);

  // ==========================================
  // 11. Caption Controls & Font Pickers
  // ==========================================
  captionInput.addEventListener('input', updateCaptionOverlay);
  captionFontSize.addEventListener('input', updateCaptionOverlay);
  captionColor.addEventListener('input', updateCaptionOverlay);

  fontPickButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      fontPickButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFontFamily = btn.dataset.font;
      updateCaptionOverlay();
    });
  });

  function updateCaptionOverlay() {
    const txt = captionInput.value.trim();
    if (!txt) {
      liveCaption.classList.add('hidden');
      return;
    }
    liveCaption.classList.remove('hidden');
    liveCaption.textContent = txt;
    liveCaption.style.fontSize = `${captionFontSize.value}px`;
    liveCaption.style.color = captionColor.value;
    liveCaption.style.fontFamily = currentFontFamily;
    updateStageOverlayPositions();
  }

  // ==========================================
  // 12. Sticker Controls
  // ==========================================
  stickerGrid.querySelectorAll('.sticker-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      stickerGrid.querySelectorAll('.sticker-pick-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSticker = btn.dataset.sticker;
      updateStickerOverlay();
    });
  });

  btnClearSticker.addEventListener('click', () => {
    stickerGrid.querySelectorAll('.sticker-pick-btn').forEach(b => b.classList.remove('active'));
    selectedSticker = '';
    updateStickerOverlay();
  });

  function updateStickerOverlay() {
    if (!selectedSticker) {
      liveSticker.classList.add('hidden');
      return;
    }
    liveSticker.classList.remove('hidden');
    liveSticker.textContent = selectedSticker;
    updateStageOverlayPositions();
  }

  // ==========================================
  // 13. Interactive Mouse Drag for Sticker & Caption
  // ==========================================
  function setupDraggable(element, onMoveCallback) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let elemInitX = 0, elemInitY = 0;

    element.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      element.classList.add('dragging');

      startX = e.clientX;
      startY = e.clientY;
      elemInitX = element.offsetLeft;
      elemInitY = element.offsetTop;

      const onMouseMove = (ev) => {
        if (!isDragging) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const stageW = stageWrapper.clientWidth;
        const stageH = stageWrapper.clientHeight;

        let newX = Math.max(0, Math.min(stageW - element.offsetWidth, elemInitX + dx));
        let newY = Math.max(0, Math.min(stageH - element.offsetHeight, elemInitY + dy));

        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
        element.style.transform = 'none';

        // Update normalized coords (center point of element)
        const centerNormX = (newX + element.offsetWidth / 2) / stageW;
        const centerNormY = (newY + element.offsetHeight / 2) / stageH;
        onMoveCallback(centerNormX, centerNormY);
      };

      const onMouseUp = () => {
        isDragging = false;
        element.classList.remove('dragging');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // Touch support for mobile/tablets
    element.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      element.classList.add('dragging');
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      elemInitX = element.offsetLeft;
      elemInitY = element.offsetTop;

      const onTouchMove = (ev) => {
        if (!isDragging || ev.touches.length !== 1) return;
        const touch = ev.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        const stageW = stageWrapper.clientWidth;
        const stageH = stageWrapper.clientHeight;

        let newX = Math.max(0, Math.min(stageW - element.offsetWidth, elemInitX + dx));
        let newY = Math.max(0, Math.min(stageH - element.offsetHeight, elemInitY + dy));

        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
        element.style.transform = 'none';

        const centerNormX = (newX + element.offsetWidth / 2) / stageW;
        const centerNormY = (newY + element.offsetHeight / 2) / stageH;
        onMoveCallback(centerNormX, centerNormY);
      };

      const onTouchEnd = () => {
        isDragging = false;
        element.classList.remove('dragging');
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };

      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    });
  }

  setupDraggable(liveCaption, (normX, normY) => {
    captionNormX = Math.max(0.05, Math.min(0.95, normX));
    captionNormY = Math.max(0.05, Math.min(0.95, normY));
  });

  setupDraggable(liveSticker, (normX, normY) => {
    stickerNormX = Math.max(0.05, Math.min(0.95, normX));
    stickerNormY = Math.max(0.05, Math.min(0.95, normY));
  });

  function updateStageOverlayPositions() {
    const stageW = stageWrapper.clientWidth;
    const stageH = stageWrapper.clientHeight;
    if (stageW <= 0 || stageH <= 0) return;

    if (!liveCaption.classList.contains('hidden')) {
      const left = captionNormX * stageW - liveCaption.offsetWidth / 2;
      const top = captionNormY * stageH - liveCaption.offsetHeight / 2;
      liveCaption.style.left = `${Math.max(0, Math.min(stageW - liveCaption.offsetWidth, left))}px`;
      liveCaption.style.top = `${Math.max(0, Math.min(stageH - liveCaption.offsetHeight, top))}px`;
      liveCaption.style.transform = 'none';
    }

    if (!liveSticker.classList.contains('hidden')) {
      const left = stickerNormX * stageW - liveSticker.offsetWidth / 2;
      const top = stickerNormY * stageH - liveSticker.offsetHeight / 2;
      liveSticker.style.left = `${Math.max(0, Math.min(stageW - liveSticker.offsetWidth, left))}px`;
      liveSticker.style.top = `${Math.max(0, Math.min(stageH - liveSticker.offsetHeight, top))}px`;
      liveSticker.style.transform = 'none';
    }
  }

  // ==========================================
  // 14. Filter Controls
  // ==========================================
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      previewVideo.style.filter = currentFilter === 'none' ? '' : currentFilter;
    });
  });

  // ==========================================
  // 15. Seek Guard (140ms Safety Timeout)
  // ==========================================
  function seekVideoSafely(video, targetTime) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (!settled) {
          settled = true;
          video.removeEventListener('seeked', finish);
          requestAnimationFrame(resolve);
        }
      };
      const timer = setTimeout(finish, 140);
      video.addEventListener('seeked', () => {
        clearTimeout(timer);
        finish();
      }, { once: true });
      video.currentTime = targetTime;
    });
  }

  // ==========================================
  // 16. Convert Video to GIF (With Free Drag Coordinates)
  // ==========================================
  btnStartConvert.addEventListener('click', async () => {
    if (isConverting) return;
    if (!previewVideo.src) {
      alert('먼저 동영상을 선택하거나 상단 샘플 영상을 클릭해 주세요.');
      return;
    }

    validateTrim();

    const startTime = parseFloat(trimStartTime.value);
    const endTime = parseFloat(trimEndTime.value);
    const duration = endTime - startTime;

    if (duration <= 0) {
      alert('유효한 변환 구간을 지정해 주세요.');
      return;
    }

    // Strict Max 30 FPS Limit
    const fps = Math.min(30, Math.max(1, parseInt(fpsRange.value, 10)));
    const targetW = Math.max(32, parseInt(targetWidthInput.value, 10) || 480);
    const targetH = Math.max(32, parseInt(targetHeightInput.value, 10) || 270);
    const { sx, sy, sw, sh } = getCropSourceCoordinates();
    const isSkip = dropFramesCheck.checked;

    isConverting = true;
    previewVideo.pause();
    btnStartConvert.disabled = true;
    btnConvertText.textContent = '🎞️ 고화질 GIF 인코딩 중...';
    statusSpinner.classList.remove('hidden');
    btnDownload.disabled = true;
    btnDownload.classList.remove('ready');
    resultPreviewCard.classList.add('hidden');

    thumbnailsContainer.innerHTML = '';
    thumbPlaceholder.style.display = 'none';
    framesCountBadge.textContent = '추출 프레임: 0개';

    captureCanvas.width = targetW;
    captureCanvas.height = targetH;

    const baseDelay = 1000 / fps;
    const finalDelay = Math.max(20, Math.round(baseDelay / currentSpeed));

    const encoder = new GIFEncoder(targetW, targetH);
    encoder.setDelay(finalDelay);
    encoder.setRepeat(0);
    encoder.start();

    const step = (1 / fps) * currentSpeed;
    const totalEstimated = Math.max(1, Math.round(duration / step));
    let frameIdx = 0;
    let extractedCount = 0;
    let curTime = startTime;

    statusMessage.textContent = '프레임 캡처 및 고속 팔레트 양자화 시작...';

    try {
      while (curTime <= endTime && extractedCount < totalEstimated) {
        if (isSkip && frameIdx % 2 === 1) {
          curTime += step;
          frameIdx++;
          continue;
        }

        await seekVideoSafely(previewVideo, curTime);

        // 1. Draw video with Crop and Filter
        captureCtx.save();
        captureCtx.clearRect(0, 0, targetW, targetH);

        if (currentFilter && currentFilter !== 'none') {
          captureCtx.filter = currentFilter;
        }

        captureCtx.drawImage(previewVideo, sx, sy, sw, sh, 0, 0, targetW, targetH);
        captureCtx.filter = 'none';
        captureCtx.restore();

        // 2. Draw Sticker at Draggable Normalized Coordinates
        if (selectedSticker) {
          drawStickerAtNorm(captureCtx, selectedSticker, stickerNormX, stickerNormY, targetW, targetH);
        }

        // 3. Draw Caption at Draggable Normalized Coordinates with Selected Font
        const capTxt = captionInput.value.trim();
        if (capTxt) {
          drawCaptionAtNorm(captureCtx, capTxt, captionNormX, captionNormY, currentFontFamily, targetW, targetH);
        }

        // 4. Encode frame with Fast Octree Quantizer
        const imgData = captureCtx.getImageData(0, 0, targetW, targetH);
        encoder.addFrame(imgData);
        extractedCount++;

        // 5. Thumbnail
        addThumbnailCell(captureCanvas, extractedCount, curTime);

        // 6. Progress Bar
        const pct = Math.min(97, Math.round((extractedCount / totalEstimated) * 94));
        progressBarFill.style.width = `${pct}%`;
        progressPercent.textContent = `${pct}%`;
        statusMessage.textContent = `프레임 인코딩 중... (${extractedCount} / ${totalEstimated})`;
        framesCountBadge.textContent = `추출 프레임: ${extractedCount}개`;

        curTime += step;
        frameIdx++;

        await new Promise(r => setTimeout(r, 0));
      }

      // Finish GIF
      statusMessage.textContent = '최종 GIF LZW 데이터 압축 및 파일 생성 완료 중...';
      progressBarFill.style.width = '99%';
      progressPercent.textContent = '99%';
      await new Promise(r => setTimeout(r, 20));

      generatedGifBlob = encoder.finish();
      if (generatedGifUrl) URL.revokeObjectURL(generatedGifUrl);
      generatedGifUrl = URL.createObjectURL(generatedGifBlob);

      // Complete!
      progressBarFill.style.width = '100%';
      progressPercent.textContent = '100%';
      statusSpinner.classList.add('hidden');
      statusMessage.textContent = '🎉 변환 완료! 우측 다운로드 버튼을 눌러 GIF를 소장하세요.';

      btnDownload.disabled = false;
      btnDownload.classList.add('ready');
      downloadBtnLabel.textContent = `다운로드 (${downloadFileName})`;

      // Result Card
      resultGifImg.src = generatedGifUrl;
      resultFilenameText.textContent = downloadFileName;
      resultFilesizeText.textContent = formatBytes(generatedGifBlob.size);
      resultResolutionText.textContent = `${targetW} × ${targetH} px`;
      resultFramesCountText.textContent = `${extractedCount} 프레임 (${fps} FPS, ${currentSpeed}x)`;
      resultPreviewCard.classList.remove('hidden');
      resultPreviewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Save to IndexedDB History
      await saveGifToHistory({
        filename: downloadFileName,
        size: generatedGifBlob.size,
        width: targetW,
        height: targetH,
        frames: extractedCount,
        blob: generatedGifBlob,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('Conversion Error:', err);
      statusMessage.textContent = '변환 중 오류: ' + err.message;
      statusSpinner.classList.add('hidden');
      alert('변환 중 오류가 발생했습니다: ' + err.message);
    } finally {
      isConverting = false;
      btnStartConvert.disabled = false;
      btnConvertText.textContent = '🎞️ 감성 스마트 GIF로 다시 변환';
    }
  });

  // Draw Sticker at Draggable Normalized Position
  function drawStickerAtNorm(ctx, sticker, normX, normY, w, h) {
    ctx.save();
    const size = Math.max(28, Math.round(w * 0.13));
    ctx.font = `${size}px 'Segoe UI Emoji', sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const x = normX * w;
    const y = normY * h;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillText(sticker, x, y);
    ctx.restore();
  }

  // Draw Caption at Draggable Normalized Position
  function drawCaptionAtNorm(ctx, text, normX, normY, fontFamily, w, h) {
    ctx.save();
    const userSize = parseInt(captionFontSize.value, 10) || 24;
    const fontSize = Math.max(14, Math.round(userSize * (w / 480)));

    ctx.font = `900 ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const x = normX * w;
    const y = normY * h;

    // Stroke
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(3.5, Math.round(fontSize * 0.18));
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);

    // Fill
    ctx.fillStyle = captionColor.value || '#ffffff';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function addThumbnailCell(sourceCanvas, frameNo, timeSec) {
    const cell = document.createElement('div');
    cell.className = 'film-cell';

    const tCanvas = document.createElement('canvas');
    tCanvas.width = 96;
    tCanvas.height = 74;
    const tCtx = tCanvas.getContext('2d');
    tCtx.drawImage(sourceCanvas, 0, 0, tCanvas.width, tCanvas.height);

    const tag = document.createElement('span');
    tag.className = 'film-cell-badge';
    tag.textContent = `#${frameNo} (${timeSec.toFixed(1)}s)`;

    cell.appendChild(tCanvas);
    cell.appendChild(tag);
    thumbnailsContainer.appendChild(cell);
    thumbnailsContainer.scrollLeft = thumbnailsContainer.scrollWidth;
  }

  // ==========================================
  // 17. Download Button (원래파일명.gif)
  // ==========================================
  btnDownload.addEventListener('click', () => {
    if (!generatedGifBlob || !generatedGifUrl) {
      alert('먼저 GIF 변환을 완료해 주세요.');
      return;
    }
    const a = document.createElement('a');
    a.href = generatedGifUrl;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // ==========================================
  // 18. IndexedDB GIF History Store (기록 및 삭제 기능)
  // ==========================================
  const DB_NAME = 'CineMotion_History_DB';
  const DB_VERSION = 1;
  const STORE_NAME = 'gifs';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveGifToHistory(item) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.add(item);
      tx.oncomplete = () => loadHistory();
    } catch (err) {
      console.warn('History save failed:', err);
    }
  }

  async function deleteGifFromHistory(id) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => loadHistory();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  async function clearAllHistory() {
    if (!confirm('지금까지 제작한 모든 GIF 기록을 삭제하시겠습니까?')) return;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => loadHistory();
    } catch (err) {
      console.error('Clear failed:', err);
    }
  }

  btnClearAllHistory.addEventListener('click', clearAllHistory);

  async function loadHistory() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = req.result || [];
        renderHistoryCards(list.reverse()); // latest first
      };
    } catch (err) {
      console.warn('History load failed:', err);
    }
  }

  function renderHistoryCards(items) {
    historyCountBadge.textContent = `기록 ${items.length}개`;

    if (!items || items.length === 0) {
      historyEmpty.style.display = 'block';
      historyGrid.innerHTML = '';
      historyGrid.appendChild(historyEmpty);
      return;
    }

    historyEmpty.style.display = 'none';
    historyGrid.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-card-item';

      const imgUrl = URL.createObjectURL(item.blob);
      const dateStr = new Date(item.timestamp).toLocaleString('ko-KR', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      card.innerHTML = `
        <div class="history-img-wrap">
          <img src="${imgUrl}" alt="${item.filename}">
        </div>
        <div class="history-body">
          <div class="history-filename" title="${item.filename}">${item.filename}</div>
          <div class="history-meta-row">
            <span>${formatBytes(item.size)} • ${item.width}×${item.height}</span>
            <span>${dateStr}</span>
          </div>
          <div class="history-actions">
            <button type="button" class="btn-history-dl" title="다시 다운로드">⬇️ 저장</button>
            <button type="button" class="btn-history-del" title="기록 삭제">🗑️</button>
          </div>
        </div>
      `;

      // Download
      card.querySelector('.btn-history-dl').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = imgUrl;
        a.download = item.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });

      // Delete
      card.querySelector('.btn-history-del').addEventListener('click', () => {
        if (confirm(`'${item.filename}' 기록을 삭제하시겠습니까?`)) {
          deleteGifFromHistory(item.id);
        }
      });

      historyGrid.appendChild(card);
    });
  }

  // Load history on startup
  loadHistory();

});
