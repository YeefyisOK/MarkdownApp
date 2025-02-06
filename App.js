import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import EditorScreen from './src/screens/EditorScreen';

const Stack = createNativeStackNavigator();

// 开启详细日志
LogBox.ignoreAllLogs();

const App = () => {
  console.log('App rendering...'); // 添加日志

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <NavigationContainer
          onStateChange={(state) => console.log('Nav state:', state)} // 导航状态变化日志
        >
          <Stack.Navigator
            screenOptions={{
              headerBackTitle: '返回',  // iOS 返回按钮文字
              headerBackButtonMenuEnabled: true,
            }}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{title: '码当笔记'}}
            />
            <Stack.Screen 
              name="Editor" 
              component={EditorScreen}
              options={({ route }) => ({ 
                title: route.params.fileName ? route.params.fileName.replace(/\.md$/, '') : '编辑文档'
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

export default App; 