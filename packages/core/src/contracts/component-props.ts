/**
 * Framework-Agnostic Component Props Contracts
 *
 * These interfaces define the canonical prop shapes stored in NodeSchema.props.
 * Both @vela/ui (Vue) and @vela/ui-react (React) implementations MUST accept
 * these canonical prop names. Where framework implementations historically used
 * different names, adapters translate from canonical → implementation.
 *
 * Naming conventions:
 * - Use the name that is most semantically clear and widely adopted
 * - When Vue and React disagree, prefer the name already stored in the schema
 *   (i.e. what the editor's setter panels produce)
 * - Style-level properties (opacity, visible, etc.) are NOT part of component
 *   props — they live in NodeSchema.style / NodeSchema.geometry
 *
 * Each interface is suffixed with `SchemaProps` to distinguish from
 * framework-specific prop types (e.g., `TextSchemaProps` vs `TextProps`).
 */

// ============================================================================
// Shared value types
// ============================================================================

/** CSS length: number is px, string allows %, rem, etc. */
export type CSSLength = number | string

/** Size presets shared across multiple components */
export type ComponentSize = 'small' | 'default' | 'large'

// ============================================================================
// Text
// ============================================================================

export interface TextSchemaProps {
  /** Text content to display */
  content?: string
  fontSize?: CSSLength
  color?: string
  fontWeight?: 'normal' | 'bold' | 'lighter' | number | string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  letterSpacing?: CSSLength
  lineHeight?: CSSLength
}

// ============================================================================
// Box
// ============================================================================

export interface BoxSchemaProps {
  content?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: CSSLength
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none'
  borderRadius?: CSSLength
  padding?: CSSLength
  boxShadow?: string
  fontSize?: CSSLength
  textColor?: string
  fontWeight?: string | number
  textAlign?: 'left' | 'center' | 'right'
  lineHeight?: CSSLength
}

// ============================================================================
// Stat
// ============================================================================

export interface StatSchemaProps {
  value?: number
  title?: string
  prefix?: string
  suffix?: string
  precision?: number
  /** Percentage change indicator */
  change?: number
  showChange?: boolean
  icon?: string
}

// ============================================================================
// CountUp
// ============================================================================

export interface CountUpSchemaProps {
  endValue?: number
  startValue?: number
  duration?: number
  prefix?: string
  suffix?: string
  separator?: string
  decimals?: number
}

// ============================================================================
// Progress
// ============================================================================

export interface ProgressSchemaProps {
  /** Progress percentage (0–100) */
  percentage?: number
  type?: 'line' | 'circle' | 'dashboard'
  status?: '' | 'success' | 'exception' | 'warning'
  strokeWidth?: number
  /** Progress bar color */
  barColor?: string
  /** Track/trail background color */
  trackColor?: string
  showText?: boolean
  /** Format pattern for display text, e.g. '{percentage}%' */
  textFormat?: string
}

// ============================================================================
// Badge
// ============================================================================

export interface BadgeSchemaProps {
  /** Badge value (number or text) */
  value?: string | number
  /** Show as dot instead of value */
  isDot?: boolean
  /** Max display number */
  max?: number
  /** Semantic color type */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** Custom badge color (overrides type) */
  color?: string
  hidden?: boolean
  showZero?: boolean
  offset?: [number, number]
}

// ============================================================================
// Table
// ============================================================================

export interface TableColumnSchema {
  /** Data field key */
  prop: string
  /** Column header label */
  label: string
  width?: CSSLength
  minWidth?: CSSLength
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  fixed?: 'left' | 'right' | boolean
  type?: 'index' | 'selection' | 'expand'
}

export interface TableSchemaProps {
  /** Row data array */
  data?: Record<string, unknown>[]
  /** Column definitions */
  columns?: TableColumnSchema[]
  stripe?: boolean
  border?: boolean
  size?: ComponentSize
  /** Row key field for optimization */
  rowKey?: string
  loading?: boolean
  maxHeight?: CSSLength
  emptyText?: string
}

// ============================================================================
// List
// ============================================================================

export interface ListSchemaProps {
  /** Data items */
  data?: Record<string, unknown>[]
  /** Field name to use as title */
  titleField?: string
  /** Field name to use as description */
  descriptionField?: string
  /** Field name for extra content */
  extraField?: string
  showBorder?: boolean
  size?: ComponentSize
  loading?: boolean
}

// ============================================================================
// Select
// ============================================================================

export interface SelectOptionSchema {
  label: string
  value: string | number
  disabled?: boolean
}

export interface SelectSchemaProps {
  value?: string | number
  options?: SelectOptionSchema[]
  placeholder?: string
  clearable?: boolean
  filterable?: boolean
  disabled?: boolean
  size?: ComponentSize
  multiple?: boolean
}

// ============================================================================
// TextInput / TextareaInput / NumberInput / RadioGroup / Checkbox
// ============================================================================

export interface TextInputSchemaProps {
  value?: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  size?: ComponentSize
  type?: 'text' | 'password' | 'email' | 'tel' | 'url'
  maxlength?: number
  showWordLimit?: boolean
}

export interface TextareaInputSchemaProps {
  value?: string
  placeholder?: string
  disabled?: boolean
  size?: ComponentSize
  rows?: number
  autosize?: boolean | { minRows?: number; maxRows?: number }
  maxlength?: number
  showWordLimit?: boolean
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
}

export interface NumberInputSchemaProps {
  value?: number
  placeholder?: string
  disabled?: boolean
  size?: ComponentSize
  min?: number
  max?: number
  step?: number
  precision?: number
  controls?: boolean
}

export interface RadioOptionSchema {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export interface RadioGroupSchemaProps {
  value?: string | number | boolean
  options?: RadioOptionSchema[]
  disabled?: boolean
  size?: ComponentSize
  direction?: 'horizontal' | 'vertical'
  optionType?: 'default' | 'button'
}

export interface CheckboxSchemaProps {
  checked?: boolean
  label?: string
  disabled?: boolean
  size?: ComponentSize
  indeterminate?: boolean
  trueValue?: string | number | boolean
  falseValue?: string | number | boolean
}

export interface DatePickerSchemaProps {
  value?: string
  placeholder?: string
  disabled?: boolean
  size?: ComponentSize
  clearable?: boolean
  format?: string
  valueFormat?: string
}

export interface TimePickerSchemaProps {
  value?: string
  placeholder?: string
  disabled?: boolean
  size?: ComponentSize
  clearable?: boolean
  format?: string
  valueFormat?: string
}

export interface UploadSchemaProps {
  value?: string[]
  action?: string
  multiple?: boolean
  limit?: number
  disabled?: boolean
  accept?: string
  autoUpload?: boolean
  listType?: 'text' | 'picture' | 'picture-card'
  buttonText?: string
}

export interface TreeSelectOptionSchema {
  label: string
  value: string | number
  disabled?: boolean
  children?: TreeSelectOptionSchema[]
}

export interface TreeSelectSchemaProps {
  value?: string | number | Array<string | number>
  options?: TreeSelectOptionSchema[]
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  multiple?: boolean
  checkStrictly?: boolean
  size?: ComponentSize
}

export interface CascaderOptionSchema {
  label: string
  value: string | number
  disabled?: boolean
  children?: CascaderOptionSchema[]
}

export interface CascaderSchemaProps {
  value?: Array<string | number>
  options?: CascaderOptionSchema[]
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  multiple?: boolean
  checkStrictly?: boolean
  size?: ComponentSize
}

// ============================================================================
// Image
// ============================================================================

export interface ImageSchemaProps {
  /** Image URL */
  url?: string
  alt?: string
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  preview?: boolean
  lazy?: boolean
  /** Fallback text/URL on error */
  errorText?: string
}

// ============================================================================
// Container / Group / Layout
// ============================================================================

export interface ContainerSchemaProps {
  padding?: CSSLength
  backgroundColor?: string
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
}

export type GroupSchemaProps = Record<string, never>

// ============================================================================
// Flex
// ============================================================================

export interface FlexSchemaProps {
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  justifyContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  gap?: CSSLength
  padding?: CSSLength
  backgroundColor?: string
  borderRadius?: CSSLength
  minHeight?: CSSLength
}

// ============================================================================
// Grid
// ============================================================================

export interface GridSchemaProps {
  /** CSS grid-template-columns, or a number for equal columns */
  columns?: number | string
  /** CSS grid-template-rows */
  rows?: number | string
  gap?: CSSLength
  rowGap?: CSSLength
  columnGap?: CSSLength
  autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense'
  padding?: CSSLength
  backgroundColor?: string
  borderRadius?: CSSLength
  minHeight?: CSSLength
}

// ============================================================================
// Modal
// ============================================================================

export interface ModalSchemaProps {
  title?: string
  visible?: boolean
  width?: CSSLength
  closable?: boolean
  /** Close when clicking mask/overlay backdrop */
  closeOnClickModal?: boolean
  fullscreen?: boolean
  showFooter?: boolean
  cancelText?: string
  confirmText?: string
  zIndex?: number
}

// ============================================================================
// Panel
// ============================================================================

export interface PanelSchemaProps {
  title?: string
  content?: string
  collapsible?: boolean
  collapsed?: boolean
  showFooter?: boolean
  footerContent?: string
}

// ============================================================================
// Tabs
// ============================================================================

export interface TabItemSchema {
  key: string
  label: string
  disabled?: boolean
}

export interface TabsSchemaProps {
  /** Tab definitions */
  tabs?: TabItemSchema[]
  /** Active tab key */
  activeTab?: string
  type?: 'line' | 'card'
  tabPosition?: 'top' | 'right' | 'bottom' | 'left'
  closable?: boolean
}

// ============================================================================
// Row / Col
// ============================================================================

export interface RowSchemaProps {
  gutter?: number
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly'
  align?: 'top' | 'middle' | 'bottom'
}

export interface ColSchemaProps {
  span?: number
  offset?: number
  push?: number
  pull?: number
  xs?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
}

// ============================================================================
// Media
// ============================================================================

export interface VideoSchemaProps {
  src?: string
  poster?: string
  autoplay?: boolean
  controls?: boolean
  loop?: boolean
  muted?: boolean
}

// ============================================================================
// Map (GIS)
// ============================================================================

export interface MapSchemaProps {
  center?: [number, number]
  zoom?: number
  style?: string
  /** Map tile URL template */
  tileUrl?: string
}

// ============================================================================
// Type-safe prop lookup by component name
// ============================================================================

/**
 * Maps canonical component names to their schema props type.
 *
 * Usage:
 * ```ts
 * type Props = ComponentPropsMap['Text']  // → TextSchemaProps
 * ```
 */
export interface ComponentPropsMap {
  Text: TextSchemaProps
  box: BoxSchemaProps
  stat: StatSchemaProps
  countUp: CountUpSchemaProps
  progress: ProgressSchemaProps
  badge: BadgeSchemaProps
  table: TableSchemaProps
  list: ListSchemaProps
  select: SelectSchemaProps
  TextInput: TextInputSchemaProps
  TextareaInput: TextareaInputSchemaProps
  NumberInput: NumberInputSchemaProps
  RadioGroup: RadioGroupSchemaProps
  Checkbox: CheckboxSchemaProps
  DatePicker: DatePickerSchemaProps
  TimePicker: TimePickerSchemaProps
  Upload: UploadSchemaProps
  TreeSelect: TreeSelectSchemaProps
  Cascader: CascaderSchemaProps
  image: ImageSchemaProps
  Container: ContainerSchemaProps
  Group: GroupSchemaProps
  flex: FlexSchemaProps
  grid: GridSchemaProps
  modal: ModalSchemaProps
  panel: PanelSchemaProps
  tabs: TabsSchemaProps
  row: RowSchemaProps
  col: ColSchemaProps
  video: VideoSchemaProps
  map: MapSchemaProps
}

/**
 * Get the props type for a component by name.
 * Falls back to Record<string, unknown> for unregistered components.
 */
export type PropsOf<T extends string> = T extends keyof ComponentPropsMap
  ? ComponentPropsMap[T]
  : Record<string, unknown>
