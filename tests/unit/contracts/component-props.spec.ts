/**
 * Phase 4: Props Contracts Conformance Tests
 *
 * Verifies that the canonical props interfaces are well-formed
 * and that ComponentPropsMap covers all expected component types.
 */
import { describe, it, expect } from 'vitest'
import type {
  TextSchemaProps,
  ProgressSchemaProps,
  BadgeSchemaProps,
  TableColumnSchema,
  TableSchemaProps,
  SelectSchemaProps,
  ImageSchemaProps,
  ContainerSchemaProps,
  FlexSchemaProps,
  GridSchemaProps,
  ModalSchemaProps,
  TabsSchemaProps,
  VideoSchemaProps,
  DatePickerSchemaProps,
  TimePickerSchemaProps,
  UploadSchemaProps,
  TreeSelectSchemaProps,
  CascaderSchemaProps,
  PropsOf,
} from '@vela/core/contracts'

// Compile-time type assertions: these will fail to compile if types are wrong

describe('Props Contracts — type-level validation', () => {
  it('TextSchemaProps has canonical content field', () => {
    const props: TextSchemaProps = { content: 'hello' }
    expect(props.content).toBe('hello')
  })

  it('TextSchemaProps supports all styling fields', () => {
    const props: TextSchemaProps = {
      content: 'test',
      fontSize: 14,
      fontWeight: 'bold',
      color: '#000',
      textAlign: 'center',
      lineHeight: 1.5,
      letterSpacing: 2,
      textDecoration: 'underline',
      ellipsis: true,
      maxLines: 3,
    }
    expect(props.fontSize).toBe(14)
    expect(props.maxLines).toBe(3)
  })

  it('ImageSchemaProps uses url as canonical', () => {
    const props: ImageSchemaProps = { url: 'https://example.com/img.png' }
    expect(props.url).toBe('https://example.com/img.png')
  })

  it('ImageSchemaProps supports fit, alt, lazy', () => {
    const props: ImageSchemaProps = {
      url: 'data:img',
      fit: 'cover',
      alt: 'alt text',
      lazy: true,
      errorText: 'Failed',
    }
    expect(props.fit).toBe('cover')
  })

  it('ProgressSchemaProps uses percentage as canonical', () => {
    const props: ProgressSchemaProps = { percentage: 75 }
    expect(props.percentage).toBe(75)
  })

  it('ProgressSchemaProps supports barColor, trackColor, showText', () => {
    const props: ProgressSchemaProps = {
      percentage: 50,
      type: 'line',
      barColor: '#409eff',
      trackColor: '#ebeef5',
      showText: true,
      textFormat: '{value}%',
      strokeWidth: 6,
    }
    expect(props.barColor).toBe('#409eff')
  })

  it('BadgeSchemaProps uses value as canonical', () => {
    const props: BadgeSchemaProps = { value: 5 }
    expect(props.value).toBe(5)
  })

  it('BadgeSchemaProps supports type, isDot, max, hidden', () => {
    const props: BadgeSchemaProps = {
      value: 99,
      type: 'danger',
      isDot: false,
      max: 99,
      hidden: false,
    }
    expect(props.max).toBe(99)
  })

  it('TableColumnSchema uses prop/label as canonical', () => {
    const col: TableColumnSchema = {
      prop: 'name',
      label: 'Name',
      width: 200,
      fixed: 'left',
      sortable: true,
    }
    expect(col.prop).toBe('name')
    expect(col.label).toBe('Name')
  })

  it('TableSchemaProps uses data as canonical', () => {
    const props: TableSchemaProps = {
      data: [{ id: 1 }],
      columns: [{ prop: 'id', label: 'ID' }],
      border: true,
      stripe: true,
      size: 'default',
    }
    expect(props.data).toHaveLength(1)
    expect(props.columns).toHaveLength(1)
  })

  it('SelectSchemaProps uses clearable as canonical', () => {
    const props: SelectSchemaProps = {
      options: [{ label: 'A', value: 'a' }],
      clearable: true,
      filterable: true,
      multiple: false,
      placeholder: 'Choose',
    }
    expect(props.clearable).toBe(true)
  })

  it('ModalSchemaProps uses visible as canonical', () => {
    const props: ModalSchemaProps = {
      visible: true,
      title: 'Dialog',
      closeOnClickModal: true,
      fullscreen: false,
      showFooter: true,
      confirmText: 'OK',
      cancelText: 'Cancel',
    }
    expect(props.visible).toBe(true)
  })

  it('FlexSchemaProps uses CSS flexbox property names', () => {
    const props: FlexSchemaProps = {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'stretch',
      flexWrap: 'wrap',
      gap: 10,
    }
    expect(props.flexDirection).toBe('row')
  })

  it('GridSchemaProps includes columns, gap, rows', () => {
    const props: GridSchemaProps = {
      columns: 3,
      rows: 2,
      gap: 16,
      rowGap: 8,
      columnGap: 12,
      autoFlow: 'row',
    }
    expect(props.columns).toBe(3)
  })

  it('TabsSchemaProps includes items and activeTab', () => {
    const props: TabsSchemaProps = {
      items: [{ label: 'Tab1', key: 'tab1' }],
      activeTab: 'tab1',
      type: 'card',
      tabPosition: 'top',
    }
    expect(props.items).toHaveLength(1)
  })

  it('ContainerSchemaProps supports padding and overflow', () => {
    const props: ContainerSchemaProps = {
      padding: '16px',
      backgroundColor: '#fff',
      overflow: 'auto',
    }
    expect(props.padding).toBe('16px')
  })

  it('VideoSchemaProps includes url and controls', () => {
    const props: VideoSchemaProps = {
      url: 'https://example.com/video.mp4',
      poster: 'thumb.jpg',
      autoplay: false,
      loop: true,
      muted: false,
      controls: true,
    }
    expect(props.url).toBe('https://example.com/video.mp4')
  })

  it('DatePicker/TimePicker schema props support canonical value + format fields', () => {
    const dateProps: DatePickerSchemaProps = {
      value: '2026-02-10',
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
      clearable: true,
    }
    const timeProps: TimePickerSchemaProps = {
      value: '10:20:30',
      format: 'HH:mm:ss',
      valueFormat: 'HH:mm:ss',
      clearable: true,
    }
    expect(dateProps.value).toBe('2026-02-10')
    expect(timeProps.value).toBe('10:20:30')
  })

  it('Upload/TreeSelect/Cascader schema props support canonical option fields', () => {
    const uploadProps: UploadSchemaProps = {
      value: ['a.png'],
      limit: 3,
      multiple: true,
      buttonText: 'Upload',
    }
    const treeSelectProps: TreeSelectSchemaProps = {
      value: '1-1',
      options: [{ label: 'root', value: '1', children: [{ label: 'leaf', value: '1-1' }] }],
      clearable: true,
    }
    const cascaderProps: CascaderSchemaProps = {
      value: ['1', '1-1'],
      options: [{ label: 'root', value: '1', children: [{ label: 'leaf', value: '1-1' }] }],
      clearable: true,
    }

    expect(uploadProps.value).toEqual(['a.png'])
    expect(treeSelectProps.options?.[0].children?.[0].value).toBe('1-1')
    expect(cascaderProps.value).toEqual(['1', '1-1'])
  })
})

describe('ComponentPropsMap — type-level lookups', () => {
  it('PropsOf<text> resolves to TextSchemaProps', () => {
    // This is a compile-time check. If it compiles, the type is correct.
    const textProps: PropsOf<'text'> = { content: 'hello' }
    expect(textProps.content).toBe('hello')
  })

  it('PropsOf<table> resolves to TableSchemaProps', () => {
    const tableProps: PropsOf<'table'> = {
      data: [],
      columns: [],
    }
    expect(tableProps.data).toEqual([])
  })

  it('PropsOf<modal> resolves to ModalSchemaProps', () => {
    const modalProps: PropsOf<'modal'> = {
      visible: false,
      title: 'Test',
    }
    expect(modalProps.visible).toBe(false)
  })
})
