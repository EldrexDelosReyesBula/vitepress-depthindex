import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import AnalyticsBanner from './AnalyticsBanner.vue';

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(AnalyticsBanner)
    });
  }
};
