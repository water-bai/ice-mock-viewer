import Editor, { EditorProps, loader } from '@monaco-editor/react';
import { forwardRef, useImperativeHandle, useRef } from 'react';

loader.config({
  paths: {
    vs: 'https://g.alicdn.com/code/lib/monaco-editor/0.35.0/min/vs',
  },
});
interface CodeEditorProps extends EditorProps {
  onSave?: (value?: string) => void;
}

const CodeEditor = ({
  onSave,
  onMount,
  ...others
}: CodeEditorProps, ref) => {
  const editorRef = useRef();
  const refCmdDown = useRef(false);

  useImperativeHandle(ref, () => ({
    getValue() {
      return editorRef.current.getValue();
    },
    getModelMarkers() {
      return editorRef.current.getModelMarkers();
    },
  }), []);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.onKeyDown((e) => {
      if (refCmdDown.current && e.keyCode === 49) {
        e.preventDefault();
        onSave?.(editor.getValue());
      }
      if (e.keyCode === 57) {
        refCmdDown.current = true;
      }
    });
    editor.onKeyUp((e) => {
      if (e.keyCode === 57) {
        refCmdDown.current = false;
      }
    });
    onMount?.(editor, monaco);
  };
  return (
    <Editor
      onMount={handleEditorDidMount}
      height="100%"
      {
        ...others
      }
    />
  );
};

export default forwardRef(CodeEditor);
