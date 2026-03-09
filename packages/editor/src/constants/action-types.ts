export interface ActionTypeOption {
  label: string
  value: string
}

export const ACTION_TYPE_OPTIONS: ActionTypeOption[] = [
  { label: '显示提示（showToast）', value: 'showToast' },
  { label: '打开链接（openUrl）', value: 'openUrl' },
  { label: '页面跳转（navigate）', value: 'navigate' },
  { label: '设置状态（setState）', value: 'setState' },
  { label: '执行脚本（runScript）', value: 'runScript' },
  { label: '调用接口（callApi）', value: 'callApi' },
  { label: '触发事件（emit）', value: 'emit' },
  { label: '打开弹窗（showDialog）', value: 'showDialog' },
  { label: '关闭弹窗（closeDialog）', value: 'closeDialog' },
  { label: '调用方法（callMethod）', value: 'callMethod' },
  { label: '切换显隐（toggle-visibility）', value: 'toggle-visibility' },
  { label: '滚动定位（scroll-to）', value: 'scroll-to' },
  { label: '全屏切换（fullscreen）', value: 'fullscreen' },
  { label: '播放动画（play-animation）', value: 'play-animation' },
  { label: '高亮元素（highlight）', value: 'highlight' },
  { label: '刷新数据（refresh-data）', value: 'refresh-data' },
]
