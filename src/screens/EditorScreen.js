import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
  Text,
  PermissionsAndroid,
  Linking,
  Pressable,
} from 'react-native';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { Button, IconButton, Portal, Dialog } from 'react-native-paper';
import RNFS from 'react-native-fs';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';

const EditorScreen = ({ route, navigation }) => {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const { fileName, isNew } = route.params;
  const viewShotRef = useRef();
  const scrollViewRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 增加最大高度
  const MAX_PAGE_HEIGHT = 10000; // 调整到 10000

  // 添加设备类型检测
  const isIpad = Platform.OS === 'ios' && Platform.isPad;
  
  // 获取设备偏移量
  const getDeviceOffset = () => {
    if (Platform.OS !== 'ios') return 60;
    
    if (isIpad) {
      const { height } = Dimensions.get('window');
      return height > 1024 ? 70 : 60;
    }
    
    // iPhone 的偏移量
    return 90;  // 增加到 90，适应更多 iPhone 机型
  };

  useEffect(() => {
    if (!isNew) {
      loadContent();
    } else {
      setIsEditing(true); // 新建文件时直接进入编辑模式
    }
  }, []);

  const loadContent = async () => {
    try {
      const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      const fileContent = await RNFS.readFile(path, 'utf8');
      setContent(fileContent);
    } catch (error) {
      console.error('Error loading file:', error);
      Alert.alert('Error', 'Failed to load file content');
    }
  };

  const saveContent = async () => {
    try {
      const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      await RNFS.writeFile(path, content, 'utf8');
      return true;  // 返回保存成功标志
    } catch (error) {
      console.error('Error saving file:', error);
      Alert.alert('Error', 'Failed to save file');
      return false;  // 返回保存失败标志
    }
  };

  // 检查相册权限
  const checkPhotoLibraryPermission = async () => {
    if (Platform.OS === 'ios') {
      try {
        console.log('[Permission] 开始检查初始权限');
        try {
          await CameraRoll.getAlbums();
          return true;
        } catch (error) {
          if (error.code === 'E_PHOTO_LIBRARY_AUTH_DENIED') {
            Alert.alert(
              'Permission Required',
              'Please allow access to photo library in Settings',
              [
                {
                  text: 'Go to Settings',
                  onPress: () => Linking.openSettings()
                },
                {
                  text: 'Cancel',
                  style: 'cancel'
                }
              ]
            );
            return false;
          }
          throw error;
        }
      } catch (error) {
        console.error('[Permission] 权限检查错误:', error);
        return false;
      }
    }
    return true;
  };

  const saveToGallery = async (uri) => {
    setIsLoading(true);
    try {
      // 检查权限

      console.log('检查权限');
      const hasPermission = await checkPhotoLibraryPermission();
      if (!hasPermission) {
        throw new Error('没有相册访问权限，请在设置中允许访问相册');
        setIsLoading(false);  // 确保加载状态被重置
      }
      
      console.log('[SaveToGallery] 开始保存图片');
      const base64Data = uri.replace(/^data:image\/\w+;base64,/, '');
      
      const tempPath = `${RNFS.TemporaryDirectoryPath}/temp_image_${Date.now()}.png`;
      console.log('[SaveToGallery] 临时文件路径:', tempPath);
      
      await RNFS.writeFile(tempPath, base64Data, 'base64');
      console.log('[SaveToGallery] 文件写入成功');
      
      const exists = await RNFS.exists(tempPath);
      console.log('[SaveToGallery] 文件存在检查:', exists);
      
      if (!exists) {
        throw new Error('临时文件创建失败');
      }
      
      console.log('[SaveToGallery] 开始调用 CameraRoll.save');
      await CameraRoll.save(`file://${tempPath}`, { type: 'photo' });
      console.log('[SaveToGallery] CameraRoll.save 成功');
      
      Alert.alert('成功', '图片已保存到图库');
      
      // 清理临时文件
      try {
        await RNFS.unlink(tempPath);
      } catch (cleanupError) {
        console.warn('[SaveToGallery] 清理临时文件失败:', cleanupError);
      }
      
    } catch (error) {
      console.error('[SaveToGallery] 错误详情:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      Alert.alert('Error', 'Failed to save to photo library: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAndShareImage = async () => {
    try {
      setIsLoading(true);
      console.log('开始生成图片, 总高度:', contentHeight);
      
      // 检查 viewShotRef 是否可用
      if (!viewShotRef.current) {
        console.error('viewShotRef is not available');
        Alert.alert('Error', 'ViewShot 组件未准备好');
        setIsLoading(false);
        return;
      }

      // 减小单页高度，增加分页数
      const MAX_PAGE_HEIGHT = 5000; // 降低单页高度限制
      const pageCount = Math.ceil(contentHeight / MAX_PAGE_HEIGHT);
      console.log('需要生成页数:', pageCount);
      
      const images = [];
      
      // 修改截图配置
      const uri = await viewShotRef.current.capture({
        format: "png",
        quality: 0.8,
        result: 'base64',
        width: Dimensions.get('window').width,
        height: Math.min(contentHeight, MAX_PAGE_HEIGHT),
        snapshotContentContainer: true,
        useRenderInContext: true
      });
      
      const base64Uri = `data:image/png;base64,${uri}`;
      images.push(base64Uri);

      setIsLoading(false);
      
      // 添加保存按钮
      Alert.alert(
        '分享选项',
        '请选择操作',
        [
          {
            text: '保存到相册',
            onPress: () => saveToGallery(base64Uri)
          },
          {
            text: '分享',
            onPress: () => Share.open({
              url: base64Uri,
              type: 'image/png',
              title: '分享 Markdown 预览',
              failOnCancel: false,
              message: fileName
            })
          },
          {
            text: '取消',
            style: 'cancel'
          }
        ]
      );
      
    } catch (error) {
      console.error('完整错误信息:', error);
      setIsLoading(false);
      if (error.message !== 'User did not share') {
        Alert.alert(
          'Error', 
          `生成图片失败:\n${error.message}\n\n${error.stack || ''}`
        );
      }
    }
  };

  const renderEditMode = () => (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={getDeviceOffset()}
    >
      <TextInput
        style={styles.editor}
        multiline
        value={content}
        onChangeText={setContent}
        placeholder="在此输入 Markdown 内容..."
        autoCapitalize="none"
        autoCorrect={false}
      />
    </KeyboardAvoidingView>
  );

  const renderPreviewMode = () => (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.previewScroll}
      >
        <ViewShot
          ref={viewShotRef}
          options={{
            format: "png",
            quality: 0.8,
            result: 'base64',
            useRenderInContext: true,
          }}
        >
          <View 
            style={styles.previewContainer}
            onLayout={(event) => {
              const {height} = event.nativeEvent.layout;
              setContentHeight(height);
            }}
          >
            <Markdown 
              style={markdownStyles}
              rules={{
                fence: (node, children, parent, styles) => {
                  return (
                    <View key={node.key} style={styles.fence}>
                      <Text style={styles.fence_code}>
                        {node.content}
                      </Text>
                    </View>
                  );
                }
              }}
            >
              {content}
            </Markdown>
          </View>
        </ViewShot>
      </ScrollView>
      <View style={styles.bottomButton}>
        <Button 
          mode="contained" 
          onPress={generateAndShareImage}
          style={styles.shareButton}
          buttonColor="#2196F3"
        >
          生成或分享图片
        </Button>
      </View>
    </View>
  );

  // 修改切换编辑模式的处理
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon={props => <Icon name={isEditing ? "eye" : "pencil"} size={24} color={props.color} />}
          size={24}
          onPress={async () => {
            if (isEditing) {
              // 从编辑模式切换到预览模式时保存
              const saved = await saveContent();
              if (saved) {
                setIsEditing(false);
              }
            } else {
              setIsEditing(true);
            }
          }}
        />
      ),
    });
  }, [navigation, isEditing, content]); // 添加 content 作为依赖

  return (
    <>
      {isEditing ? renderEditMode() : renderPreviewMode()}

      <Portal>
        <Dialog visible={isLoading} dismissable={false}>
          <Dialog.Content>
            <Text>正在生成图片，请稍候...</Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </>
  );
};


const markdownStyles = {
    body: {
      color: '#333',
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      fontSize: 28,
      marginBottom: 16,
      fontWeight: 'bold',
      color: '#000',
      lineHeight: 36,
      marginTop: 32,
    },
    heading2: {
      fontSize: 24,
      marginBottom: 14,
      fontWeight: 'bold',
      color: '#222',
      lineHeight: 32,
      marginTop: 28,
    },
    heading3: {
      fontSize: 20,
      marginBottom: 12,
      fontWeight: 'bold',
      color: '#333',
      lineHeight: 28,
      marginTop: 24,
    },
    paragraph: {
      marginBottom: 12,
      lineHeight: 24,
      fontSize: 16,
      letterSpacing: 0.5,
      marginVertical: 8,
    },
    link: {
      color: '#2196F3',
    },
    list_item: {
      marginBottom: 8,
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    blockquote: {
      backgroundColor: '#f5f5f5',
      padding: 10,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#2196F3',
      marginVertical: 16,
      paddingVertical: 12,
    },
    code_inline: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      backgroundColor: '#f5f5f5',
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    code_block: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      backgroundColor: '#f5f5f5',
      padding: 10,
      borderRadius: 4,
    },
    fence: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      backgroundColor: '#f5f5f5',
      padding: 10,
      borderRadius: 4,
      marginVertical: 8,
    },
    fence_code: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: '#333',
    }
  };
  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  editor: {
    flex: 1,
    padding: 15,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  fullWidthButton: {
    width: '100%',
  },
  previewScroll: {
    flex: 1,
  },
  previewContainer: {
    padding: 15,
    paddingBottom: 80,
    backgroundColor: 'white',
    minHeight: Dimensions.get('window').height - 200,
  },
  bottomButton: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  shareButton: {
    width: '100%',
  },
});

export default EditorScreen; 