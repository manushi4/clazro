/**
 * Advanced Image Picker Component
 * Camera integration, cropping, and image selection
 * Phase 73: File Upload & Media Management
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { launchImageLibrary, launchCamera, MediaType, ImagePickerResponse } from 'react-native-image-picker';
import ImageCropPicker, { Image as CropImage, Options as CropOptions } from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LightTheme, PrimaryColors, SemanticColors } from '../../theme/colors';
import FilePreview from './FilePreview';

const { width: screenWidth } = Dimensions.get('window');

export interface ImagePickerProps {
  onImageSelected: (images: SelectedImage[]) => void;
  maxImages?: number;
  allowMultiple?: boolean;
  enableCropping?: boolean;
  cropOptions?: Partial<CropOptions>;
  imageQuality?: number;
  maxWidth?: number;
  maxHeight?: number;
  allowEditing?: boolean;
  style?: any;
  children?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectedImage {
  uri: string;
  name: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  exif?: any;
  cropRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const ImagePicker: React.FC<ImagePickerProps> = ({
  onImageSelected,
  maxImages = 1,
  allowMultiple = false,
  enableCropping = false,
  cropOptions = {},
  imageQuality = 0.8,
  maxWidth = 2048,
  maxHeight = 2048,
  allowEditing = true,
  style,
  children,
  disabled = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const defaultCropOptions: CropOptions = {
    width: 800,
    height: 800,
    cropping: enableCropping,
    cropperCircleOverlay: false,
    sortOrder: 'none',
    compressImageMaxWidth: maxWidth,
    compressImageMaxHeight: maxHeight,
    compressImageQuality: imageQuality,
    mediaType: 'photo',
    includeBase64: false,
    includeExif: true,
    avoidEmptySpaceAroundImage: true,
    enableRotationGesture: true,
    disableCropperColorSetters: false,
    cropperActiveWidgetColor: PrimaryColors.primary500,
    cropperStatusBarLight: PrimaryColors.primary700,
    cropperToolbarColor: PrimaryColors.primary500,
    cropperToolbarWidgetColor: '#FFFFFF',
    freeStyleCropEnabled: true,
    ...cropOptions,
  };

  const processImagePickerResult = useCallback((response: ImagePickerResponse): SelectedImage[] => {
    if (!response.assets) return [];

    return response.assets.map((asset, index) => ({
      uri: asset.uri!,
      name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
      type: asset.type || 'image/jpeg',
      size: asset.fileSize || 0,
      width: asset.width,
      height: asset.height,
      exif: asset.exif,
    }));
  }, []);

  const processCropPickerResult = useCallback((images: CropImage | CropImage[]): SelectedImage[] => {
    const imageArray = Array.isArray(images) ? images : [images];

    return imageArray.map((image, index) => ({
      uri: image.path,
      name: image.filename || `image_${Date.now()}_${index}.jpg`,
      type: image.mime || 'image/jpeg',
      size: image.size || 0,
      width: image.width,
      height: image.height,
      cropRect: image.cropRect,
    }));
  }, []);

  const openCamera = useCallback(async () => {
    setIsModalVisible(false);
    setIsProcessing(true);

    try {
      if (enableCropping) {
        const image = await ImageCropPicker.openCamera({
          ...defaultCropOptions,
          multiple: false,
        });
        const processedImages = processCropPickerResult(image);
        setSelectedImages(processedImages);
        onImageSelected(processedImages);
      } else {
        const options = {
          mediaType: 'photo' as MediaType,
          includeBase64: false,
          maxHeight: maxHeight,
          maxWidth: maxWidth,
          quality: 0.8,
        };

        launchCamera(options, (response) => {
          if (response.assets && !response.didCancel && !response.errorMessage) {
            const processedImages = processImagePickerResult(response);
            setSelectedImages(processedImages);
            onImageSelected(processedImages);
          }
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('error', 'Failed to open camera. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [
    enableCropping,
    defaultCropOptions,
    processCropPickerResult,
    maxHeight,
    maxWidth,
    imageQuality,
    processImagePickerResult,
    onImageSelected,
  ]);

  const openImageLibrary = useCallback(async () => {
    setIsModalVisible(false);
    setIsProcessing(true);

    try {
      if (enableCropping) {
        const images = await ImageCropPicker.openPicker({
          ...defaultCropOptions,
          multiple: allowMultiple && maxImages > 1,
          maxFiles: maxImages,
        });
        const processedImages = processCropPickerResult(images);
        setSelectedImages(processedImages);
        onImageSelected(processedImages);
      } else {
        const options = {
          mediaType: 'photo' as MediaType,
          includeBase64: false,
          maxHeight: maxHeight,
          maxWidth: maxWidth,
          quality: 0.8,
          selectionLimit: allowMultiple ? maxImages : 1,
        };

        launchImageLibrary(options, (response) => {
          if (response.assets && !response.didCancel && !response.errorMessage) {
            const processedImages = processImagePickerResult(response);
            setSelectedImages(processedImages);
            onImageSelected(processedImages);
          }
        });
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('error', 'Failed to open image library. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [
    enableCropping,
    defaultCropOptions,
    allowMultiple,
    maxImages,
    processCropPickerResult,
    maxHeight,
    maxWidth,
    imageQuality,
    processImagePickerResult,
    onImageSelected,
  ]);

  const editImage = useCallback(async (imageUri: string, index: number) => {
    if (!enableCropping && !allowEditing) return;

    setIsProcessing(true);

    try {
      const editedImage = await ImageCropPicker.openCropper({
        path: imageUri,
        ...defaultCropOptions,
      });

      const processedImage = processCropPickerResult(editedImage)[0];
      
      setSelectedImages(prev => {
        const updated = [...prev];
        updated[index] = processedImage;
        onImageSelected(updated);
        return updated;
      });
    } catch (error) {
      console.error('Image editing error:', error);
      Alert.alert('error', 'Failed to edit image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [enableCropping, allowEditing, defaultCropOptions, processCropPickerResult, onImageSelected]);

  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      onImageSelected(updated);
      return updated;
    });
  }, [onImageSelected]);

  const clearAllImages = useCallback(() => {
    setSelectedImages([]);
    onImageSelected([]);
  }, [onImageSelected]);

  const requestCameraPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await Linking.openSettings();
        return granted;
      } catch (error) {
        console.error('Permission error:', error);
        return false;
      }
    }
    return true;
  }, []);

  const renderSelectionModal = () => (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Image Source</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Icon name="close" size={24} color={LightTheme.OnSurface} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalOptions}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={openCamera}
              disabled={isProcessing}
            >
              <Icon name="camera-alt" size={32} color={PrimaryColors.primary500} />
              <Text style={styles.modalOptionText}>Camera</Text>
              <Text style={styles.modalOptionSubtext}>Take a new photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={openImageLibrary}
              disabled={isProcessing}
            >
              <Icon name="photo-library" size={32} color={PrimaryColors.primary500} />
              <Text style={styles.modalOptionText}>Gallery</Text>
              <Text style={styles.modalOptionSubtext}>
                Choose from {allowMultiple ? 'photos' : 'photo'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalFooter}>
            <Text style={styles.modalFooterText}>
              {enableCropping ? 'Images will be cropped after selection' : ''}
              {allowMultiple ? ` • Max ${maxImages} images` : ''}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSelectedImages = () => {
    if (selectedImages.length === 0) return null;

    return (
      <View style={styles.selectedImagesContainer}>
        <View style={styles.selectedImagesHeader}>
          <Text style={styles.selectedImagesTitle}>
            Selected Images ({selectedImages.length}/{maxImages})
          </Text>
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={clearAllImages}
          >
            <Text style={styles.clearAllButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectedImagesList}
          contentContainerStyle={styles.selectedImagesContent}
        >
          {selectedImages.map((image, index) => (
            <View key={index} style={styles.selectedImageItem}>
              <FilePreview
                file={{
                  uri: image.uri,
                  name: image.name,
                  type: image.type,
                  size: image.size,
                }}
                size={80}
                onPress={() => allowEditing && editImage(image.uri, index)}
              />

              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Icon name="close" size={16} color="white" />
              </TouchableOpacity>

              {allowEditing && (
                <TouchableOpacity
                  style={styles.editImageButton}
                  onPress={() => editImage(image.uri, index)}
                  disabled={isProcessing}
                >
                  <Icon name="edit" size={16} color={PrimaryColors.primary500} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (children) {
    return (
      <TouchableOpacity
        style={style}
        onPress={() => !disabled && setIsModalVisible(true)}
        disabled={disabled || isProcessing}
        activeOpacity={0.7}
      >
        {children}
        {renderSelectionModal()}
        {renderSelectedImages()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          disabled && styles.pickerButtonDisabled,
          selectedImages.length >= maxImages && styles.pickerButtonFull,
        ]}
        onPress={() => setIsModalVisible(true)}
        disabled={disabled || isProcessing || selectedImages.length >= maxImages}
      >
        <Icon
          name={selectedImages.length > 0 ? "add-photo-alternate" : "add-a-photo"}
          size={32}
          color={
            disabled || selectedImages.length >= maxImages
              ? LightTheme.OnSurfaceVariant
              : PrimaryColors.primary500
          }
        />
        <Text style={[
          styles.pickerButtonText,
          disabled && styles.pickerButtonTextDisabled,
        ]}>
          {selectedImages.length >= maxImages
            ? `Maximum ${maxImages} images selected`
            : selectedImages.length > 0
            ? `Add more images (${selectedImages.length}/${maxImages})`
            : 'Select Images'
          }
        </Text>
        <Text style={styles.pickerButtonSubtext}>
          Camera • Gallery{enableCropping ? ' • Crop & Edit' : ''}
        </Text>
      </TouchableOpacity>

      {renderSelectionModal()}
      {renderSelectedImages()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pickerButton: {
    borderWidth: 2,
    borderColor: PrimaryColors.primary500,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: LightTheme.Surface,
    minHeight: 100,
    justifyContent: 'center',
  },
  pickerButtonDisabled: {
    borderColor: LightTheme.OnSurfaceVariant,
    backgroundColor: LightTheme.SurfaceVariant,
  },
  pickerButtonFull: {
    borderColor: SemanticColors.Warning,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginTop: 8,
    textAlign: 'center',
  },
  pickerButtonTextDisabled: {
    color: LightTheme.OnSurfaceVariant,
  },
  pickerButtonSubtext: {
    fontSize: 12,
    color: LightTheme.OnSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: LightTheme.Surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  modalOption: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: LightTheme.Surface,
    minWidth: 120,
    flex: 1,
    marginHorizontal: 8,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginTop: 12,
  },
  modalOptionSubtext: {
    fontSize: 12,
    color: LightTheme.OnSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  modalFooter: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalFooterText: {
    fontSize: 12,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  selectedImagesContainer: {
    marginTop: 16,
  },
  selectedImagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedImagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: SemanticColors.Error,
    borderRadius: 6,
  },
  clearAllButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  selectedImagesList: {
    maxHeight: 120,
  },
  selectedImagesContent: {
    paddingHorizontal: 4,
  },
  selectedImageItem: {
    marginHorizontal: 6,
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: SemanticColors.Error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  editImageButton: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: LightTheme.Surface,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: LightTheme.OutlineVariant,
  },
});

export default ImagePicker;
export { ImagePicker };