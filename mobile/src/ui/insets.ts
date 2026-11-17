import { Platform, StatusBar } from 'react-native';

/** 状态栏 / 刘海。内容从这条线下面开始，避免滚到系统栏底下。 */
export const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 47;

/** 底部手势条。底栏背景要铺到这条线。 */
export const BOTTOM_INSET = Platform.OS === 'android' ? 24 : 34;

export const TAB_BODY = 48;
