/**
 * Whiteboard - Advanced Drawing Canvas
 * Features: Shapes, Text, Highlighter, Stroke Width, Colors, Grid, Zoom/Pan
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  Share,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<any, 'Whiteboard'>;

interface DrawingEvent {
  type: 'draw' | 'erase' | 'clear' | 'shape' | 'text';
  tool: string;
  color: string;
  width: number;
  points?: Array<{ x: number; y: number }>;
  shape?: { type: string; x1: number; y1: number; x2: number; y2: number };
  text?: { content: string; x: number; y: number; size: number };
  timestamp: number;
  userId: string;
}

type ToolType = 'pen' | 'eraser' | 'highlighter' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'stamp' | 'pointer';
type BackgroundType = 'blank' | 'grid' | 'dots' | 'lines';

interface SavedDrawing {
  id: string;
  name: string;
  file_path: string;
  thumbnail: string;
  created_at: string;
  user_id: string;
}

export default function Whiteboard({ route, navigation }: Props) {
  const { user } = useAuth();
  const webViewRef = useRef<WebView>(null);
  const realtimeChannel = useRef<any>(null);

  const [selectedTool, setSelectedTool] = useState<ToolType>('pen');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [showTools, setShowTools] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [background, setBackground] = useState<BackgroundType>('blank');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [textInput, setTextInput] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);

  // New features state
  const [showStamps, setShowStamps] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedDrawings, setSavedDrawings] = useState<SavedDrawing[]>([]);
  const [loadingSave, setLoadingSave] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Layers/Pages state
  const [pages, setPages] = useState<string[]>(['']); // Store canvas data URLs
  const [currentPage, setCurrentPage] = useState(0);
  const [showPagesPanel, setShowPagesPanel] = useState(false);

  const classId = route.params?.classId || 'demo-class';

  useEffect(() => {
    trackScreenView('Whiteboard', { classId });
  }, [classId]);

  // Real-time collaboration
  useEffect(() => {
    const channelName = `whiteboard-${classId}`;
    realtimeChannel.current = supabase.channel(channelName);

    realtimeChannel.current
      .on('broadcast', { event: 'drawing' }, (payload: any) => {
        if (payload.payload.userId !== user?.id) {
          applyRemoteDrawing(payload.payload);
        }
      })
      .subscribe();

    return () => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, [classId, user?.id]);

  const applyRemoteDrawing = (event: DrawingEvent) => {
    webViewRef.current?.postMessage(JSON.stringify({
      action: 'applyRemoteDrawing',
      data: event,
    }));
  };

  const broadcastDrawing = (event: DrawingEvent) => {
    if (realtimeChannel.current) {
      realtimeChannel.current.send({
        type: 'broadcast',
        event: 'drawing',
        payload: { ...event, userId: user?.id },
      });
    }
  };

  // Expanded color palette
  const primaryColors = ['#000000', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B', '#EAB308'];
  const secondaryColors = ['#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9'];
  const tertiaryColors = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'];

  const handleToolSelect = (tool: ToolType) => {
    console.log('🔧 Tool selected:', tool);
    if (tool === 'text') {
      console.log('📝 Opening text modal');
      setShowTextModal(true);
      return;
    }
    setSelectedTool(tool);
    sendToWebView({ action: 'setTool', tool });
    trackAction('select_tool', 'Whiteboard', { tool });
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    sendToWebView({ action: 'setColor', color });
  };

  const handleStrokeWidthChange = (width: number) => {
    setStrokeWidth(width);
    sendToWebView({ action: 'setStrokeWidth', width });
  };

  const handleBackgroundChange = (bg: BackgroundType) => {
    setBackground(bg);
    sendToWebView({ action: 'setBackground', background: bg });
    setShowBackgrounds(false);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.25, 3);
    setZoomLevel(newZoom);
    sendToWebView({ action: 'setZoom', zoom: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.25, 0.5);
    setZoomLevel(newZoom);
    sendToWebView({ action: 'setZoom', zoom: newZoom });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    sendToWebView({ action: 'setZoom', zoom: 1 });
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      setSelectedTool('text');
      sendToWebView({ action: 'setTool', tool: 'text', text: textInput });
      setShowTextModal(false);
      setTextInput('');
    }
  };

  const handleUndo = () => {
    sendToWebView({ action: 'undo' });
    trackAction('undo', 'Whiteboard');
  };

  const handleClear = () => {
    Alert.alert('Clear Canvas', 'Clear all drawings?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          sendToWebView({ action: 'clear' });
          broadcastDrawing({
            type: 'clear',
            tool: 'clear',
            color: '',
            width: 0,
            timestamp: Date.now(),
            userId: user?.id || '',
          });
        },
      },
    ]);
  };

  // Stamps/Stickers
  const stamps = [
    { id: 'pi', label: 'π', category: 'math' },
    { id: 'sqrt', label: '√', category: 'math' },
    { id: 'sum', label: '∑', category: 'math' },
    { id: 'integral', label: '∫', category: 'math' },
    { id: 'infinity', label: '∞', category: 'math' },
    { id: 'delta', label: 'Δ', category: 'math' },
    { id: 'theta', label: 'θ', category: 'math' },
    { id: 'lambda', label: 'λ', category: 'math' },
    { id: 'alpha', label: 'α', category: 'math' },
    { id: 'beta', label: 'β', category: 'math' },
    { id: 'gamma', label: 'γ', category: 'math' },
    { id: 'omega', label: 'Ω', category: 'math' },
    { id: 'check', label: '✓', category: 'marks' },
    { id: 'cross', label: '✗', category: 'marks' },
    { id: 'star', label: '⭐', category: 'marks' },
    { id: 'heart', label: '❤️', category: 'marks' },
    { id: 'arrow_up', label: '↑', category: 'arrows' },
    { id: 'arrow_down', label: '↓', category: 'arrows' },
    { id: 'arrow_left', label: '←', category: 'arrows' },
    { id: 'arrow_right', label: '→', category: 'arrows' },
  ];

  const handleStampSelect = (stamp: string) => {
    console.log('🔣 Stamp selected:', stamp);
    setSelectedStamp(stamp);
    setSelectedTool('stamp');
    sendToWebView({ action: 'setTool', tool: 'stamp', stamp });
    setShowStamps(false);
    trackAction('select_stamp', 'Whiteboard', { stamp });
  };

  // Export/Share functionality
  const handleExport = () => {
    setShowMenuModal(false);
    sendToWebView({ action: 'getCanvasData' });
  };

  const handleShare = async (dataUrl: string) => {
    try {
      await Share.share({
        message: 'Check out my whiteboard drawing!',
        url: dataUrl,
        title: 'Whiteboard Drawing',
      });
      trackAction('share_drawing', 'Whiteboard');
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share drawing');
    }
  };

  // Save to Supabase Storage
  const handleSaveDrawing = async () => {
    if (!saveName.trim()) {
      Alert.alert('Error', 'Please enter a name for your drawing');
      return;
    }

    setLoadingSave(true);
    sendToWebView({ action: 'getCanvasData' });
  };

  const saveToSupabase = async (dataUrl: string) => {
    try {
      const timestamp = Date.now();
      const fileName = `${user?.id || 'guest'}_${timestamp}.png`;

      // Convert base64 to ArrayBuffer for React Native
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

      // Decode base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error } = await supabase.storage
        .from('whiteboard-drawings')
        .upload(fileName, bytes.buffer, {
          contentType: 'image/png',
        });

      if (error) throw error;

      // Save metadata
      const { error: metaError } = await supabase
        .from('whiteboard_drawings')
        .insert({
          user_id: user?.id,
          name: saveName,
          file_path: fileName,
          thumbnail: dataUrl.substring(0, 200), // Store small preview
        });

      if (metaError) {
        console.warn('Metadata save error:', metaError);
      }

      Alert.alert('Success', 'Drawing saved!');
      setShowSaveModal(false);
      setSaveName('');
      trackAction('save_drawing', 'Whiteboard', { name: saveName });
    } catch (error: any) {
      console.error('Save error:', error);
      if (error?.message?.includes('Bucket not found')) {
        Alert.alert(
          'Storage Not Configured',
          'The whiteboard-drawings storage bucket needs to be created in Supabase. Your drawing data is ' + dataUrl.length + ' bytes.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to save drawing: ' + (error?.message || 'Unknown error'));
      }
      setShowSaveModal(false);
      setSaveName('');
    } finally {
      setLoadingSave(false);
    }
  };

  // Load saved drawings
  const loadSavedDrawings = async () => {
    try {
      const { data, error } = await supabase
        .from('whiteboard_drawings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedDrawings(data || []);
    } catch (error) {
      console.error('Load drawings error:', error);
      // Use mock data if table doesn't exist
      setSavedDrawings([]);
    }
  };

  // Page/Layer management
  const saveCurrentPage = (callback?: () => void) => {
    const script = `
      (function() {
        var dataUrl = document.getElementById('canvas').toDataURL('image/png');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'pageData',
          dataUrl: dataUrl,
          callback: ${callback ? 'true' : 'false'}
        }));
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  const handleAddPage = () => {
    saveCurrentPage();
    const newPages = [...pages];
    newPages[currentPage] = ''; // Will be filled by WebView response
    setPages([...newPages, '']);
    setCurrentPage(pages.length);
    sendToWebView({ action: 'clear' });
    trackAction('add_page', 'Whiteboard', { pageNumber: pages.length + 1 });
  };

  const handleSwitchPage = (pageIndex: number) => {
    if (pageIndex === currentPage) return;

    // Save current page first
    const script = `
      (function() {
        var dataUrl = document.getElementById('canvas').toDataURL('image/png');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'switchPage',
          dataUrl: dataUrl,
          newPageIndex: ${pageIndex}
        }));
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  const handleDeletePage = (pageIndex: number) => {
    if (pages.length <= 1) {
      Alert.alert('Cannot Delete', 'You need at least one page.');
      return;
    }

    Alert.alert('Delete Page', `Delete page ${pageIndex + 1}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const newPages = pages.filter((_, i) => i !== pageIndex);
          setPages(newPages);

          // Adjust current page if needed
          if (pageIndex <= currentPage) {
            const newCurrentPage = Math.max(0, currentPage - 1);
            setCurrentPage(newCurrentPage);
            if (newPages[newCurrentPage]) {
              sendToWebView({ action: 'loadImage', dataUrl: newPages[newCurrentPage] });
            } else {
              sendToWebView({ action: 'clear' });
            }
          }
          trackAction('delete_page', 'Whiteboard', { pageNumber: pageIndex + 1 });
        },
      },
    ]);
  };

  const handleLoadDrawing = async (drawing: SavedDrawing) => {
    try {
      // Use file_path, not id
      const { data, error } = await supabase.storage
        .from('whiteboard-drawings')
        .download(drawing.file_path || drawing.id);

      if (error) throw error;

      const reader = new FileReader();
      reader.onloadend = () => {
        sendToWebView({ action: 'loadImage', dataUrl: reader.result });
        setShowLoadModal(false);
        trackAction('load_drawing', 'Whiteboard', { name: drawing.name });
      };
      reader.readAsDataURL(data);
    } catch (error) {
      console.error('Load drawing error:', error);
      Alert.alert('Error', 'Failed to load drawing');
    }
  };

  const sendToWebView = (message: any) => {
    console.log('📤 Sending to WebView:', message);
    const script = `
      (function() {
        try {
          var message = ${JSON.stringify(message)};
          if (window.handleMessage) {
            window.handleMessage(JSON.stringify(message));
          }
        } catch(e) {
          console.error('Send error:', e);
        }
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📨 WebView message:', message.type);

      switch (message.type) {
        case 'drawing':
          broadcastDrawing(message.data);
          break;
        case 'historyChange':
          setCanUndo(message.canUndo);
          break;
        case 'log':
          console.log('📋 [Canvas]', message.message);
          break;
        case 'canvasData':
          // Handle export/save
          if (loadingSave) {
            saveToSupabase(message.dataUrl);
          } else {
            // For now, just show success message
            Alert.alert('Export Ready', 'Drawing exported! Data URL length: ' + message.dataUrl.length + ' bytes');
            console.log('📤 Canvas data URL ready for export');
          }
          break;
        case 'pageData':
          // Save current page data
          const newPages = [...pages];
          newPages[currentPage] = message.dataUrl;
          setPages(newPages);
          break;
        case 'switchPage':
          // Save current page and switch to new one
          const updatedPages = [...pages];
          updatedPages[currentPage] = message.dataUrl;
          setPages(updatedPages);
          setCurrentPage(message.newPageIndex);
          // Load the new page
          if (updatedPages[message.newPageIndex]) {
            sendToWebView({ action: 'loadImage', dataUrl: updatedPages[message.newPageIndex] });
          } else {
            sendToWebView({ action: 'clear' });
          }
          trackAction('switch_page', 'Whiteboard', { pageNumber: message.newPageIndex + 1 });
          break;
      }
    } catch (error) {
      console.error('❌ WebView error:', error);
    }
  };

  const canvasHTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #FFFFFF;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
    }
    #canvasContainer {
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
    }
    #canvas {
      position: absolute;
      top: 0;
      left: 0;
      touch-action: none;
      transform-origin: 0 0;
    }
    #bgCanvas {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="canvasContainer">
    <canvas id="bgCanvas"></canvas>
    <canvas id="canvas"></canvas>
  </div>
</body>
</html>`;

  const canvasScript = `
    (function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'log',
        message: '🚀 Advanced whiteboard initializing...'
      }));

      var canvas = document.getElementById('canvas');
      var bgCanvas = document.getElementById('bgCanvas');
      var container = document.getElementById('canvasContainer');

      if (!canvas || !bgCanvas) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          message: '❌ Canvas elements not found!'
        }));
        return;
      }

      var ctx = canvas.getContext('2d');
      var bgCtx = bgCanvas.getContext('2d');

      if (!ctx || !bgCtx) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          message: '❌ Could not get 2D contexts!'
        }));
        return;
      }

      // State variables
      var tool = 'pen';
      var color = '#000000';
      var strokeWidth = 3;
      var isDrawing = false;
      var startX = 0;
      var startY = 0;
      var lastX = 0;
      var lastY = 0;
      var history = [];
      var historyStep = -1;
      var MAX_HISTORY = 50;
      var currentPath = [];
      var backgroundType = 'blank';
      var zoom = 1;
      var panX = 0;
      var panY = 0;
      var textToAdd = '';
      var stampToAdd = '';
      var isPanning = false;
      var lastPanX = 0;
      var lastPanY = 0;
      var pointerX = 0;
      var pointerY = 0;
      var showPointer = false;

      function resizeCanvas() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        bgCanvas.width = w;
        bgCanvas.height = h;
        drawBackground();
        redrawCanvas();

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          message: '📏 Canvas: ' + canvas.width + 'x' + canvas.height
        }));
      }

      function updateTransform() {
        // Zoom disabled for now - keeping it simple
      }

      function drawBackground() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.fillStyle = '#FFFFFF';
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

        if (backgroundType === 'grid') {
          bgCtx.strokeStyle = '#E5E7EB';
          bgCtx.lineWidth = 1;
          var gridSize = 20;
          for (var x = 0; x <= bgCanvas.width; x += gridSize) {
            bgCtx.beginPath();
            bgCtx.moveTo(x, 0);
            bgCtx.lineTo(x, bgCanvas.height);
            bgCtx.stroke();
          }
          for (var y = 0; y <= bgCanvas.height; y += gridSize) {
            bgCtx.beginPath();
            bgCtx.moveTo(0, y);
            bgCtx.lineTo(bgCanvas.width, y);
            bgCtx.stroke();
          }
        } else if (backgroundType === 'dots') {
          bgCtx.fillStyle = '#D1D5DB';
          var dotSize = 20;
          for (var x = dotSize; x < bgCanvas.width; x += dotSize) {
            for (var y = dotSize; y < bgCanvas.height; y += dotSize) {
              bgCtx.beginPath();
              bgCtx.arc(x, y, 1.5, 0, Math.PI * 2);
              bgCtx.fill();
            }
          }
        } else if (backgroundType === 'lines') {
          bgCtx.strokeStyle = '#E5E7EB';
          bgCtx.lineWidth = 1;
          var lineSpacing = 25;
          for (var y = lineSpacing; y < bgCanvas.height; y += lineSpacing) {
            bgCtx.beginPath();
            bgCtx.moveTo(0, y);
            bgCtx.lineTo(bgCanvas.width, y);
            bgCtx.stroke();
          }
        }
      }

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      function saveState() {
        try {
          historyStep++;
          if (historyStep < history.length) {
            history.length = historyStep;
          }
          history.push(canvas.toDataURL());
          if (history.length > MAX_HISTORY) {
            history.shift();
            historyStep--;
          }
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'historyChange',
            canUndo: historyStep > 0,
          }));
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'log',
            message: '💾 Saved state #' + historyStep + ' (total: ' + history.length + ')'
          }));
        } catch (error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'log',
            message: '⚠️ saveState error: ' + error.message
          }));
        }
      }

      function undo() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          message: '↩️ Undo: historyStep=' + historyStep + ', history.length=' + history.length
        }));

        if (historyStep > 0) {
          historyStep--;
          var img = new Image();
          img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'historyChange',
              canUndo: historyStep > 0,
            }));
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'log',
              message: '✅ Undo complete, now at step ' + historyStep
            }));
          };
          img.onerror = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'log',
              message: '❌ Undo failed to load image'
            }));
          };
          img.src = history[historyStep];
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'log',
            message: '⚠️ Nothing to undo'
          }));
        }
      }

      function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveState();
      }

      function redrawCanvas() {
        if (historyStep >= 0 && history[historyStep]) {
          var img = new Image();
          img.onload = function() {
            ctx.drawImage(img, 0, 0);
          };
          img.src = history[historyStep];
        }
      }

      function drawPointer() {
        if (!showPointer || tool !== 'pointer') return;

        // Redraw from history first
        if (historyStep >= 0 && history[historyStep]) {
          var img = new Image();
          img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            // Draw pointer circle (red with glow effect)
            ctx.beginPath();
            ctx.arc(pointerX, pointerY, 15, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pointerX, pointerY, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#EF4444';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pointerX, pointerY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
          };
          img.src = history[historyStep];
        } else {
          // Draw pointer on blank canvas
          ctx.beginPath();
          ctx.arc(pointerX, pointerY, 15, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(pointerX, pointerY, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#EF4444';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(pointerX, pointerY, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        }
      }

      function hidePointer() {
        if (showPointer && tool === 'pointer') {
          showPointer = false;
          // Redraw canvas without pointer
          if (historyStep >= 0 && history[historyStep]) {
            var img = new Image();
            img.onload = function() {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
            };
            img.src = history[historyStep];
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }

      function getTouchPos(e) {
        var rect = canvas.getBoundingClientRect();
        var touch;

        // On touchend, e.touches is empty, use changedTouches instead
        if (e.changedTouches && e.changedTouches.length > 0) {
          touch = e.changedTouches[0];
        } else if (e.touches && e.touches.length > 0) {
          touch = e.touches[0];
        } else {
          touch = e;
        }

        var x = touch.clientX - rect.left;
        var y = touch.clientY - rect.top;
        return { x: x, y: y };
      }

      function startDrawing(e) {
        if (e.touches && e.touches.length > 1) {
          isPanning = true;
          lastPanX = e.touches[0].clientX;
          lastPanY = e.touches[0].clientY;
          return;
        }

        e.preventDefault();
        var pos = getTouchPos(e);

        // Handle pointer tool separately (doesn't draw, just shows pointer)
        if (tool === 'pointer') {
          pointerX = pos.x;
          pointerY = pos.y;
          showPointer = true;
          drawPointer();
          return;
        }

        isDrawing = true;
        startX = pos.x;
        startY = pos.y;
        lastX = pos.x;
        lastY = pos.y;
        currentPath = [{ x: pos.x, y: pos.y }];

        // Always start a new path for freehand tools
        if (tool === 'pen' || tool === 'eraser' || tool === 'highlighter') {
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
        }

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          message: '🎨 Start: ' + tool + ' at ' + Math.round(pos.x) + ',' + Math.round(pos.y)
        }));
      }

      function draw(e) {
        if (isPanning && e.touches && e.touches.length > 1) {
          var dx = e.touches[0].clientX - lastPanX;
          var dy = e.touches[0].clientY - lastPanY;
          panX += dx / zoom;
          panY += dy / zoom;
          lastPanX = e.touches[0].clientX;
          lastPanY = e.touches[0].clientY;
          updateTransform();
          return;
        }

        // Handle pointer tool movement
        if (tool === 'pointer' && showPointer) {
          e.preventDefault();
          var pPos = getTouchPos(e);
          pointerX = pPos.x;
          pointerY = pPos.y;
          drawPointer();
          return;
        }

        if (!isDrawing) return;
        e.preventDefault();
        var pos = getTouchPos(e);

        if (tool === 'pen') {
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = 1;
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          currentPath.push({ x: pos.x, y: pos.y });
        } else if (tool === 'highlighter') {
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeWidth * 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = 0.3;
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          currentPath.push({ x: pos.x, y: pos.y });
        } else if (tool === 'eraser') {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = strokeWidth * 4;
          ctx.lineCap = 'round';
          ctx.globalAlpha = 1;
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          currentPath.push({ x: pos.x, y: pos.y });
        }
        // For shapes, we don't draw during move - only on release

        lastX = pos.x;
        lastY = pos.y;
      }

      function stopDrawing(e) {
        if (isPanning) {
          isPanning = false;
          return;
        }

        // Handle pointer tool end
        if (tool === 'pointer' && showPointer) {
          hidePointer();
          return;
        }

        if (!isDrawing) return;
        e.preventDefault();

        var pos = getTouchPos(e);
        ctx.globalAlpha = 1;

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          message: '🏁 Stop: ' + tool + ' at ' + Math.round(pos.x) + ',' + Math.round(pos.y)
        }));

        // Draw shapes on release
        if (tool === 'line') {
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeWidth;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        } else if (tool === 'rectangle') {
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeWidth;
          ctx.beginPath();
          ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
        } else if (tool === 'circle') {
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeWidth;
          var radius = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
          ctx.beginPath();
          ctx.arc(startX, startY, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (tool === 'arrow') {
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeWidth;
          ctx.fillStyle = color;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();

          var angle = Math.atan2(pos.y - startY, pos.x - startX);
          var headLength = 15;
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pos.x - headLength * Math.cos(angle - Math.PI / 6), pos.y - headLength * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(pos.x - headLength * Math.cos(angle + Math.PI / 6), pos.y - headLength * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        } else if (tool === 'text' && textToAdd) {
          ctx.fillStyle = color;
          ctx.font = strokeWidth * 6 + 'px Arial';
          ctx.fillText(textToAdd, pos.x, pos.y);
          textToAdd = '';
        } else if (tool === 'stamp' && stampToAdd) {
          ctx.fillStyle = color;
          ctx.font = (strokeWidth * 8) + 'px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(stampToAdd, pos.x, pos.y);
          ctx.textAlign = 'start';
          ctx.textBaseline = 'alphabetic';
        }

        isDrawing = false;

        // Always save state after drawing
        saveState();

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'drawing',
          data: {
            type: tool === 'text' ? 'text' : (tool === 'line' || tool === 'rectangle' || tool === 'circle' || tool === 'arrow' ? 'shape' : 'draw'),
            tool: tool,
            color: color,
            width: strokeWidth,
            points: currentPath,
            shape: { type: tool, x1: startX, y1: startY, x2: pos.x, y2: pos.y },
            timestamp: Date.now()
          }
        }));

        currentPath = [];
      }

      function applyRemoteDrawing(event) {
        if (event.type === 'clear') {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
        }

        if (event.type === 'shape' && event.shape) {
          var s = event.shape;
          ctx.strokeStyle = event.color;
          ctx.lineWidth = event.width;
          ctx.fillStyle = event.color;

          if (s.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();
          } else if (s.type === 'rectangle') {
            ctx.strokeRect(s.x1, s.y1, s.x2 - s.x1, s.y2 - s.y1);
          } else if (s.type === 'circle') {
            var r = Math.sqrt(Math.pow(s.x2 - s.x1, 2) + Math.pow(s.y2 - s.y1, 2));
            ctx.beginPath();
            ctx.arc(s.x1, s.y1, r, 0, Math.PI * 2);
            ctx.stroke();
          } else if (s.type === 'arrow') {
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();
            var angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
            var headLength = 15;
            ctx.beginPath();
            ctx.moveTo(s.x2, s.y2);
            ctx.lineTo(s.x2 - headLength * Math.cos(angle - Math.PI / 6), s.y2 - headLength * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(s.x2 - headLength * Math.cos(angle + Math.PI / 6), s.y2 - headLength * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
          }
          saveState();
          return;
        }

        if (!event.points || event.points.length === 0) return;

        if (event.tool === 'highlighter') {
          ctx.globalAlpha = 0.3;
          ctx.lineWidth = event.width * 3;
        } else {
          ctx.globalAlpha = 1;
          ctx.lineWidth = event.tool === 'eraser' ? event.width * 4 : event.width;
        }

        ctx.strokeStyle = event.tool === 'eraser' ? '#FFFFFF' : event.color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(event.points[0].x, event.points[0].y);
        for (var i = 1; i < event.points.length; i++) {
          ctx.lineTo(event.points[i].x, event.points[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        saveState();
      }

      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing, { passive: false });
      canvas.addEventListener('touchcancel', stopDrawing, { passive: false });

      // Also listen on document level to catch touch end outside canvas
      document.addEventListener('touchend', function(e) {
        if (isDrawing) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'log',
            message: '⚠️ Touch ended on document'
          }));
          stopDrawing(e);
        }
      }, { passive: false });

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      document.addEventListener('mouseup', function(e) {
        if (isDrawing) {
          stopDrawing(e);
        }
      });

      function handleMessage(data) {
        try {
          var message = JSON.parse(data);

          switch (message.action) {
            case 'setTool':
              tool = message.tool;
              if (message.text) {
                textToAdd = message.text;
              }
              if (message.stamp) {
                stampToAdd = message.stamp;
              }
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                message: '🔧 Tool changed to: ' + tool
              }));
              break;
            case 'setColor':
              color = message.color;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                message: '🎨 Color changed to: ' + color
              }));
              break;
            case 'setStrokeWidth':
              strokeWidth = message.width;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                message: '📏 Stroke width: ' + strokeWidth
              }));
              break;
            case 'setBackground':
              backgroundType = message.background;
              drawBackground();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                message: '📄 Background: ' + backgroundType
              }));
              break;
            case 'setZoom':
              zoom = message.zoom;
              updateTransform();
              break;
            case 'undo':
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                message: '↩️ Undo called, historyStep: ' + historyStep
              }));
              undo();
              break;
            case 'clear':
              clearCanvas();
              break;
            case 'applyRemoteDrawing':
              applyRemoteDrawing(message.data);
              break;
            case 'getCanvasData':
              var dataUrl = canvas.toDataURL('image/png');
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'canvasData',
                dataUrl: dataUrl
              }));
              break;
            case 'loadImage':
              var img = new Image();
              img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                saveState();
              };
              img.src = message.dataUrl;
              break;
          }
        } catch (error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'log',
            message: '❌ Message error: ' + error.message
          }));
        }
      }

      // Make handleMessage available globally for injectJavaScript
      window.handleMessage = handleMessage;

      document.addEventListener('message', function(event) {
        handleMessage(event.data);
      });
      window.addEventListener('message', function(event) {
        handleMessage(event.data);
      });

      // Save initial blank state
      saveState();

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'log',
        message: '✅ Whiteboard ready! Tool: ' + tool + ', HistoryStep: ' + historyStep
      }));

    })();

    true;
  `;

  return (
    <View style={styles.container}>
      {/* Canvas WebView */}
      <WebView
        ref={webViewRef}
        source={{ html: canvasHTML }}
        injectedJavaScript={canvasScript}
        onMessage={handleWebViewMessage}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        androidLayerType="hardware"
        pointerEvents={showTextModal || showStamps || showMenuModal || showSaveModal || showLoadModal ? 'none' : 'auto'}
        onLoad={() => {
          setTimeout(() => {
            sendToWebView({ action: 'setTool', tool: 'pen' });
            sendToWebView({ action: 'setColor', color: '#000000' });
            sendToWebView({ action: 'setStrokeWidth', width: 3 });
          }, 500);
        }}
      />

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Close whiteboard"
      >
        <T style={styles.closeIcon}>×</T>
      </TouchableOpacity>

      {/* Menu Button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          console.log('📋 Menu button pressed');
          setShowMenuModal(true);
        }}
        accessibilityLabel="Menu"
      >
        <T style={styles.menuIcon}>☰</T>
      </TouchableOpacity>

      {/* Zoom Controls - Disabled for now */}
      {false && (
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn}>
            <T style={styles.zoomText}>+</T>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} onPress={handleResetZoom}>
            <T style={styles.zoomText}>{Math.round(zoomLevel * 100)}%</T>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut}>
            <T style={styles.zoomText}>−</T>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Toolbar */}
      {showTools && (
        <View style={styles.toolbar}>
          {/* Primary Tools */}
          <View style={styles.toolRow}>
            <TouchableOpacity
              style={[styles.toolBtn, selectedTool === 'pen' && styles.toolBtnActive]}
              onPress={() => handleToolSelect('pen')}
            >
              <T style={styles.toolEmoji}>✏️</T>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, selectedTool === 'highlighter' && styles.toolBtnActive]}
              onPress={() => handleToolSelect('highlighter')}
            >
              <T style={styles.toolEmoji}>🖍️</T>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, selectedTool === 'eraser' && styles.toolBtnActive]}
              onPress={() => handleToolSelect('eraser')}
            >
              <T style={styles.toolEmoji}>🧹</T>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setShowMoreTools(!showMoreTools)}
            >
              <T style={styles.toolEmoji}>📐</T>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setShowColorPicker(!showColorPicker)}
            >
              <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setShowBackgrounds(!showBackgrounds)}
            >
              <T style={styles.toolEmoji}>📄</T>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, !canUndo && styles.toolBtnDisabled]}
              onPress={handleUndo}
              disabled={!canUndo}
            >
              <T style={styles.toolEmoji}>↩️</T>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.toolBtn, styles.clearBtn]} onPress={handleClear}>
              <T style={styles.toolEmoji}>🗑️</T>
            </TouchableOpacity>
          </View>

          {/* Stroke Width Controls */}
          <View style={styles.sliderRow}>
            <T style={styles.sliderLabel}>Size: {strokeWidth}px</T>
            <View style={styles.sizeButtons}>
              <TouchableOpacity
                style={styles.sizeBtn}
                onPress={() => handleStrokeWidthChange(Math.max(1, strokeWidth - 1))}
              >
                <T style={styles.sizeBtnText}>−</T>
              </TouchableOpacity>
              {[1, 3, 6, 10, 15, 20].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizePreset,
                    strokeWidth === size && styles.sizePresetActive,
                  ]}
                  onPress={() => handleStrokeWidthChange(size)}
                >
                  <View
                    style={[
                      styles.sizePresetDot,
                      { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 },
                    ]}
                  />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.sizeBtn}
                onPress={() => handleStrokeWidthChange(Math.min(20, strokeWidth + 1))}
              >
                <T style={styles.sizeBtnText}>+</T>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* More Tools Popup */}
      {showMoreTools && (
        <TouchableOpacity
          style={styles.popupOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreTools(false)}
        >
          <View
            style={styles.popup}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <T style={styles.popupTitle}>Shapes & Tools</T>
            <View style={styles.popupGrid}>
            <TouchableOpacity
              style={[styles.popupBtn, selectedTool === 'line' && styles.toolBtnActive]}
              onPress={() => { handleToolSelect('line'); setShowMoreTools(false); }}
            >
              <T style={styles.popupEmoji}>📏</T>
              <T style={styles.popupLabel}>Line</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupBtn, selectedTool === 'rectangle' && styles.toolBtnActive]}
              onPress={() => { handleToolSelect('rectangle'); setShowMoreTools(false); }}
            >
              <T style={styles.popupEmoji}>⬜</T>
              <T style={styles.popupLabel}>Rectangle</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupBtn, selectedTool === 'circle' && styles.toolBtnActive]}
              onPress={() => { handleToolSelect('circle'); setShowMoreTools(false); }}
            >
              <T style={styles.popupEmoji}>⭕</T>
              <T style={styles.popupLabel}>Circle</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupBtn, selectedTool === 'arrow' && styles.toolBtnActive]}
              onPress={() => { handleToolSelect('arrow'); setShowMoreTools(false); }}
            >
              <T style={styles.popupEmoji}>➡️</T>
              <T style={styles.popupLabel}>Arrow</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupBtn, selectedTool === 'text' && styles.toolBtnActive]}
              onPress={() => { handleToolSelect('text'); setShowMoreTools(false); }}
            >
              <T style={styles.popupEmoji}>🔤</T>
              <T style={styles.popupLabel}>Text</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupBtn, selectedTool === 'stamp' && styles.toolBtnActive]}
              onPress={() => {
                console.log('🔣 Opening stamps modal');
                setShowStamps(true);
                setShowMoreTools(false);
              }}
            >
              <T style={styles.popupEmoji}>🔣</T>
              <T style={styles.popupLabel}>Stamps</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupBtn, selectedTool === 'pointer' && styles.toolBtnActive]}
              onPress={() => { handleToolSelect('pointer'); setShowMoreTools(false); }}
            >
              <T style={styles.popupEmoji}>👆</T>
              <T style={styles.popupLabel}>Pointer</T>
            </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Color Picker Popup */}
      {showColorPicker && (
        <View style={styles.colorPopup}>
          <T style={styles.popupTitle}>Colors</T>
          <View style={styles.colorGrid}>
            {[...primaryColors, ...secondaryColors, ...tertiaryColors].map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorOptionActive,
                ]}
                onPress={() => { handleColorSelect(c); setShowColorPicker(false); }}
              />
            ))}
          </View>
        </View>
      )}

      {/* Background Options Popup */}
      {showBackgrounds && (
        <View style={styles.popup}>
          <T style={styles.popupTitle}>Background</T>
          <View style={styles.popupGrid}>
            <TouchableOpacity
              style={[styles.popupBtn, background === 'blank' && styles.toolBtnActive]}
              onPress={() => handleBackgroundChange('blank')}
            >
              <T style={styles.popupEmoji}>⬜</T>
              <T style={styles.popupLabel}>Blank</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupBtn, background === 'grid' && styles.toolBtnActive]}
              onPress={() => handleBackgroundChange('grid')}
            >
              <T style={styles.popupEmoji}>📊</T>
              <T style={styles.popupLabel}>Grid</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupBtn, background === 'dots' && styles.toolBtnActive]}
              onPress={() => handleBackgroundChange('dots')}
            >
              <T style={styles.popupEmoji}>⚫</T>
              <T style={styles.popupLabel}>Dots</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupBtn, background === 'lines' && styles.toolBtnActive]}
              onPress={() => handleBackgroundChange('lines')}
            >
              <T style={styles.popupEmoji}>📝</T>
              <T style={styles.popupLabel}>Lines</T>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Text Input Overlay */}
      {showTextModal && (
        <View style={styles.fullScreenOverlay}>
          <View style={styles.modalContent}>
            <T style={styles.modalTitle}>Add Text</T>
            <TextInput
              style={styles.textInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Type your text..."
              autoFocus
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setShowTextModal(false)}
              >
                <T style={styles.modalBtnText}>Cancel</T>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleTextSubmit}
              >
                <T style={{...styles.modalBtnText, ...styles.modalBtnTextPrimary}}>Add</T>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Stamps Overlay */}
      {showStamps && (
        <View style={styles.fullScreenOverlay}>
          <View style={styles.modalContent}>
            <T style={styles.modalTitle}>Select Stamp</T>
            <ScrollView style={styles.stampsScrollView}>
              <T style={styles.stampCategory}>Math Symbols</T>
              <View style={styles.stampsGrid}>
                {stamps.filter(s => s.category === 'math').map((stamp) => (
                  <TouchableOpacity
                    key={stamp.id}
                    style={[
                      styles.stampBtn,
                      selectedStamp === stamp.label && styles.stampBtnActive,
                    ]}
                    onPress={() => handleStampSelect(stamp.label)}
                  >
                    <T style={styles.stampLabel}>{stamp.label}</T>
                  </TouchableOpacity>
                ))}
              </View>
              <T style={styles.stampCategory}>Marks</T>
              <View style={styles.stampsGrid}>
                {stamps.filter(s => s.category === 'marks').map((stamp) => (
                  <TouchableOpacity
                    key={stamp.id}
                    style={[
                      styles.stampBtn,
                      selectedStamp === stamp.label && styles.stampBtnActive,
                    ]}
                    onPress={() => handleStampSelect(stamp.label)}
                  >
                    <T style={styles.stampLabel}>{stamp.label}</T>
                  </TouchableOpacity>
                ))}
              </View>
              <T style={styles.stampCategory}>Arrows</T>
              <View style={styles.stampsGrid}>
                {stamps.filter(s => s.category === 'arrows').map((stamp) => (
                  <TouchableOpacity
                    key={stamp.id}
                    style={[
                      styles.stampBtn,
                      selectedStamp === stamp.label && styles.stampBtnActive,
                    ]}
                    onPress={() => handleStampSelect(stamp.label)}
                  >
                    <T style={styles.stampLabel}>{stamp.label}</T>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setShowStamps(false)}
            >
              <T style={styles.modalBtnText}>Cancel</T>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu Modal - Using View overlay instead of Modal */}
      {showMenuModal && (
        <TouchableOpacity
          style={styles.fullScreenOverlay}
          activeOpacity={1}
          onPress={() => setShowMenuModal(false)}
        >
          <View style={styles.menuModalContent}>
            <T style={styles.modalTitle}>Menu</T>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setShowMenuModal(false);
                setShowSaveModal(true);
              }}
            >
              <T style={styles.menuOptionIcon}>💾</T>
              <T style={styles.menuOptionText}>Save Drawing</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={handleExport}
            >
              <T style={styles.menuOptionIcon}>📤</T>
              <T style={styles.menuOptionText}>Export / Share</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setShowMenuModal(false);
                loadSavedDrawings();
                setShowLoadModal(true);
              }}
            >
              <T style={styles.menuOptionIcon}>📂</T>
              <T style={styles.menuOptionText}>Load Drawing</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuOption, styles.menuOptionDanger]}
              onPress={() => {
                setShowMenuModal(false);
                handleClear();
              }}
            >
              <T style={styles.menuOptionIcon}>🗑️</T>
              <T style={{...styles.menuOptionText, ...styles.menuOptionTextDanger}}>Clear All</T>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Save Drawing Modal */}
      <Modal visible={showSaveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <T style={styles.modalTitle}>Save Drawing</T>
            <TextInput
              style={styles.textInput}
              value={saveName}
              onChangeText={setSaveName}
              placeholder="Enter drawing name..."
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => {
                  setShowSaveModal(false);
                  setSaveName('');
                }}
              >
                <T style={styles.modalBtnText}>Cancel</T>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleSaveDrawing}
                disabled={loadingSave}
              >
                {loadingSave ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <T style={{...styles.modalBtnText, ...styles.modalBtnTextPrimary}}>Save</T>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Load Drawing Modal */}
      <Modal visible={showLoadModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.loadModalContent}>
            <T style={styles.modalTitle}>Load Drawing</T>
            {savedDrawings.length === 0 ? (
              <View style={styles.emptyState}>
                <T style={styles.emptyIcon}>📁</T>
                <T style={styles.emptyText}>No saved drawings yet</T>
                <T style={styles.emptySubtext}>
                  Save your drawings to access them here
                </T>
              </View>
            ) : (
              <FlatList
                data={savedDrawings}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.savedDrawingItem}
                    onPress={() => handleLoadDrawing(item)}
                  >
                    <View style={styles.savedDrawingInfo}>
                      <T style={styles.savedDrawingName}>{item.name}</T>
                      <T style={styles.savedDrawingDate}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </T>
                    </View>
                    <T style={styles.loadIcon}>→</T>
                  </TouchableOpacity>
                )}
                style={styles.savedDrawingsList}
              />
            )}
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setShowLoadModal(false)}
            >
              <T style={styles.modalBtnText}>Close</T>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pages/Layers Panel */}
      {showPagesPanel && (
        <View style={styles.pagesPanel}>
          <View style={styles.pagesPanelHeader}>
            <T style={styles.pagesPanelTitle}>Pages ({pages.length})</T>
            <TouchableOpacity
              style={styles.addPageBtn}
              onPress={handleAddPage}
              accessibilityLabel="Add new page"
            >
              <T style={styles.addPageIcon}>+</T>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pagesScrollView} horizontal>
            {pages.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pageThumb,
                  currentPage === index && styles.pageThumbActive,
                ]}
                onPress={() => handleSwitchPage(index)}
                onLongPress={() => handleDeletePage(index)}
              >
                <T style={styles.pageNumber}>{index + 1}</T>
                {currentPage === index && (
                  <View style={styles.currentPageIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <T style={styles.pageHint}>Tap to switch, long press to delete</T>
        </View>
      )}

      {/* Pages Toggle Button */}
      <TouchableOpacity
        style={styles.pagesToggleBtn}
        onPress={() => setShowPagesPanel(!showPagesPanel)}
        accessibilityLabel="Toggle pages panel"
      >
        <T style={styles.pagesToggleIcon}>📑</T>
        <T style={styles.pagesCount}>{currentPage + 1}/{pages.length}</T>
      </TouchableOpacity>

      {/* Toggle Toolbar */}
      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={() => setShowTools(!showTools)}
      >
        <T style={styles.toggleIcon}>{showTools ? '▼' : '▲'}</T>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  closeIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 32,
  },
  menuButton: {
    position: 'absolute',
    top: 60,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 20,
  },
  menuIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  zoomControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 4,
    elevation: 5,
  },
  zoomBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  zoomText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  toolbar: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  toolBtnDisabled: {
    opacity: 0.3,
  },
  clearBtn: {
    backgroundColor: '#FEE2E2',
  },
  toolEmoji: {
    fontSize: 20,
  },
  colorPreview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6B7280',
    width: 60,
  },
  sizeButtons: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sizeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  sizePreset: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sizePresetActive: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#DBEAFE',
  },
  sizePresetDot: {
    backgroundColor: '#374151',
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 45,
  },
  popup: {
    position: 'absolute',
    bottom: 180,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 16,
    elevation: 12,
    zIndex: 50,
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1F2937',
  },
  popupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  popupBtn: {
    width: 70,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  popupEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  popupLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  colorPopup: {
    position: 'absolute',
    bottom: 180,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 16,
    elevation: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  colorOptionActive: {
    borderColor: '#1F2937',
    borderWidth: 3,
  },
  toggleBtn: {
    position: 'absolute',
    bottom: 140,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    elevation: 200,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalBtnPrimary: {
    backgroundColor: '#3B82F6',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalBtnTextPrimary: {
    color: '#FFFFFF',
  },
  // Stamps Modal Styles
  stampsScrollView: {
    maxHeight: 300,
    marginBottom: 16,
  },
  stampCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stampBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stampBtnActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  stampLabel: {
    fontSize: 24,
  },
  // Menu Modal Styles
  menuModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    alignSelf: 'center',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  menuOptionDanger: {
    backgroundColor: '#FEF2F2',
  },
  menuOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  menuOptionTextDanger: {
    color: '#DC2626',
  },
  // Load Modal Styles
  loadModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  savedDrawingsList: {
    marginBottom: 16,
  },
  savedDrawingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  savedDrawingInfo: {
    flex: 1,
  },
  savedDrawingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  savedDrawingDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  loadIcon: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Pages/Layers Panel Styles
  pagesPanel: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 12,
    padding: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pagesPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pagesPanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  addPageBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPageIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pagesScrollView: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pageThumb: {
    width: 50,
    height: 65,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pageThumbActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  pageNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  currentPageIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  pageHint: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  pagesToggleBtn: {
    position: 'absolute',
    top: 12,
    left: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 99,
  },
  pagesToggleIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  pagesCount: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
