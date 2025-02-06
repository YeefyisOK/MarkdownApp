import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  Animated,
} from 'react-native';
import RNFS from 'react-native-fs';
import { FAB, IconButton, Button, List, Searchbar, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Swipeable } from 'react-native-gesture-handler';

const HomeScreen = ({ navigation }) => {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchMode, setSearchMode] = useState('filename'); // 'filename' or 'content'
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFiles();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFiles(files);
      return;
    }
    
    const search = async () => {
      setIsSearching(true);
      try {
        if (searchMode === 'filename') {
          const filtered = files.filter(file => 
            file.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setFilteredFiles(filtered);
        } else {
          // 搜索文件内容
          const results = [];
          for (const file of files) {
            try {
              const content = await RNFS.readFile(file.path, 'utf8');
              if (content.toLowerCase().includes(searchQuery.toLowerCase())) {
                results.push(file);
              }
            } catch (error) {
              console.error(`Error reading file ${file.name}:`, error);
            }
          }
          setFilteredFiles(results);
        }
      } finally {
        setIsSearching(false);
      }
    };
    
    // 使用防抖来优化性能
    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [files, searchQuery, searchMode]);

  const loadFiles = async () => {
    try {
      const documentsPath = RNFS.DocumentDirectoryPath;
      const result = await RNFS.readDir(documentsPath);
      const mdFiles = result
        .filter(file => file.name.endsWith('.md'))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      setFiles(mdFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      Alert.alert('错误', '加载文件失败');
    }
  };

  const createNewFile = async () => {
    Alert.prompt(
      '新建文档',
      '请输入文档标题',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定',
          onPress: (title) => {
            if (!title) return;
            const fileName = `${title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '_')}.md`;
            navigation.navigate('Editor', { 
              isNew: true,
              fileName: fileName,
              title: title.split('.')[0]
            });
          }
        },
      ],
      'plain-text',
      ''
    );
  };

  const deleteFile = async (fileName) => {
    try {
      const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      await RNFS.unlink(path);
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      Alert.alert('错误', '删除文件失败');
    }
  };

  const confirmDelete = (fileName) => {
    Alert.alert(
      '删除文件',
      `确定要删除 ${fileName} 吗？`,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          onPress: () => deleteFile(fileName),
          style: 'destructive',
        },
      ]
    );
  };

  const renameFile = async (oldFileName, newTitle) => {
    try {
      const oldPath = `${RNFS.DocumentDirectoryPath}/${oldFileName}`;
      const newFileName = `${newTitle.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '_')}.md`;
      const newPath = `${RNFS.DocumentDirectoryPath}/${newFileName}`;
      
      // 检查新文件名是否已存在
      const exists = await RNFS.exists(newPath);
      if (exists) {
        Alert.alert('错误', '文件名已存在');
        return;
      }

      // 先读取内容
      const content = await RNFS.readFile(oldPath, 'utf8');
      // 删除旧文件
      await RNFS.unlink(oldPath);
      // 写入新文件
      await RNFS.writeFile(newPath, content, 'utf8');
      
      loadFiles();
    } catch (error) {
      console.error('Error renaming file:', error);
      Alert.alert('错误', '重命名文件失败');
    }
  };

  const promptRename = (fileName) => {
    const currentTitle = fileName.replace(/\.md$/, '');
    Alert.prompt(
      '重命名文档',
      '请输入新的文档标题',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定',
          onPress: (newTitle) => {
            if (!newTitle || newTitle === currentTitle) return;
            renameFile(fileName, newTitle);
          }
        },
      ],
      'plain-text',
      currentTitle
    );
  };

  const renderRightActions = (progress, dragX, item) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => confirmDelete(item.name)}
      >
        <Animated.View
          style={[
            styles.deleteActionContent,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <Icon name="trash-can-outline" size={24} color="white" />
          <Text style={styles.deleteActionText}>删除</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, item)
      }
    >
      <TouchableOpacity
        style={styles.fileItem}
        onPress={() => navigation.navigate('Editor', { 
          isNew: false,
          fileName: item.name 
        })}
        onLongPress={() => promptRename(item.name)}
      >
        <Text style={styles.fileName}>
          {item.name.replace(/\.md$/, '')}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={searchMode === 'filename' ? "搜索文件名..." : "搜索文件内容..."}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[
            styles.searchBar,
            { justifyContent: 'center' }
          ]}
          inputStyle={{
            fontSize: 15,
            height: '100%',
            alignSelf: 'center',
          }}
          iconColor="#666"
          placeholderTextColor="#999"
        />
        <View style={styles.chipContainer}>
          <Chip
            selected={searchMode === 'filename'}
            onPress={() => setSearchMode('filename')}
            style={[
              styles.chip,
              searchMode === 'filename' && styles.selectedChip
            ]}
            textStyle={[
              styles.chipText,
              searchMode === 'filename' && styles.selectedChipText
            ]}
          >
            文件名
          </Chip>
          <Chip
            selected={searchMode === 'content'}
            onPress={() => setSearchMode('content')}
            style={[
              styles.chip,
              searchMode === 'content' && styles.selectedChip
            ]}
            textStyle={[
              styles.chipText,
              searchMode === 'content' && styles.selectedChipText
            ]}
          >
            内容
          </Chip>
        </View>
      </View>
      {files.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无 Markdown 文件</Text>
          <Text style={styles.emptySubText}>点击右下角按钮创建新文件</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          keyExtractor={item => item.name}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <List.Item
                title={isSearching ? "正在搜索..." : "没有找到匹配的文件"}
                left={props => <List.Icon {...props} icon={isSearching ? "magnify" : "file-search"} />}
              />
            </View>
          )}
          renderItem={renderItem}
        />
      )}
      <FAB
        style={styles.fab}
        icon={() => <Icon name="plus" size={24} color="white" />}
        onPress={createNewFile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fileItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 16,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  deleteAction: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  deleteActionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionText: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    height: 44,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 4,
  },
  chip: {
    marginRight: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    height: 32,
  },
  selectedChip: {
    backgroundColor: '#2196F3',
  },
  chipText: {
    fontSize: 13,
  },
  selectedChipText: {
    color: 'white',
  },
});

export default HomeScreen; 