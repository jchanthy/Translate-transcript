import React, { useState, useCallback, ChangeEvent, useMemo } from 'react';
import { LANGUAGES } from './constants';
import { translateSrt } from './services/geminiService';

// --- Icon Components ---
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const TranslateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m4 13-4 4-4-4M19 5h-2.25l-1.95-3.036a.75.75 0 00-1.2-.316L12 5H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" />
    </svg>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- Data Structure ---
interface SrtLine {
  id: number;
  sequence: string;
  timestamp: string;
  text: string;
}

// --- UI Components ---
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  disabled: boolean;
}
const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile, disabled }) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label htmlFor="file-upload" className={`relative cursor-pointer rounded-lg border-2 border-dashed border-gray-500 hover:border-brand-primary transition-colors duration-300 flex flex-col items-center justify-center p-6 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <UploadIcon />
        <span className="mt-2 text-sm font-medium text-gray-200">
          {selectedFile ? 'File selected:' : 'Upload your .SRT file'}
        </span>
        {selectedFile ? (
          <div className="mt-2 flex items-center bg-base-300 px-3 py-1 rounded-full text-sm font-medium text-gray-200">
            <FileIcon />
            <span>{selectedFile.name}</span>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-1">Click to browse or drag & drop</p>
        )}
      </label>
      <input id="file-upload" name="file-upload" type="file" accept=".srt" className="sr-only" onChange={handleFileChange} disabled={disabled} />
    </div>
  );
};

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled: boolean;
}
const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange, disabled }) => (
  <div className="w-full">
    <select
      id="language"
      name="language"
      value={selectedLanguage}
      onChange={(e) => onLanguageChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-base-200 border border-gray-600 text-white rounded-lg focus:ring-brand-primary focus:border-brand-primary p-3 transition-colors duration-300 disabled:opacity-50"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.name}>
          {lang.name}
        </option>
      ))}
    </select>
  </div>
);

interface EditableResultDisplayProps {
  lines: SrtLine[];
  onLineChange: (index: number, newText: string) => void;
  fileName: string;
  targetLanguage: string;
}
const EditableResultDisplay: React.FC<EditableResultDisplayProps> = ({ lines, onLineChange, fileName, targetLanguage }) => {
  const reconstructSrt = (lines: SrtLine[]): string => {
    return lines.map(line => `${line.sequence}\n${line.timestamp}\n${line.text}`).join('\n\n') + '\n';
  };

  const handleDownload = () => {
    const translatedContent = reconstructSrt(lines);
    const blob = new Blob([translatedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const langCode = LANGUAGES.find(l => l.name === targetLanguage)?.code || 'translated';
    const newFileName = `${fileName.replace(/\.srt$/, '')}_${langCode}.srt`;
    link.href = url;
    link.setAttribute('download', newFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    onLineChange(index, e.target.value);
  };

  return (
    <div className="w-full mt-6 bg-base-200 p-4 rounded-lg shadow-inner">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Edit Translated Subtitles</h3>
        <button
            onClick={handleDownload}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300"
        >
            <DownloadIcon />
            Download .srt
        </button>
      </div>
      <div className="w-full h-96 overflow-y-auto bg-base-100 p-2 rounded-md space-y-3">
        {lines.map((line, index) => (
            <div key={line.id} className="grid grid-cols-[40px_1fr] items-start gap-x-4 p-3 bg-base-300 rounded-lg text-sm">
                <div className="font-mono text-gray-400 text-center mt-1">{line.sequence}</div>
                <div>
                    <p className="font-mono text-xs text-gray-500 mb-1">{line.timestamp}</p>
                    <textarea
                        value={line.text}
                        onChange={(e) => handleTextChange(e, index)}
                        className="w-full bg-base-200 text-gray-200 p-2 rounded-md resize-none border border-gray-600 focus:border-brand-primary focus:ring-brand-primary transition overflow-hidden"
                        rows={line.text.split('\n').length || 1}
                    />
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};


// --- Main App Component ---
function App() {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('Spanish');
  const [editableLines, setEditableLines] = useState<SrtLine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const parseSrt = (srtContent: string): SrtLine[] => {
    if (!srtContent) return [];
    const blocks = srtContent.trim().split(/(?:\r\n|\r|\n){2,}/);
    return blocks.map((block, index) => {
        const lines = block.split(/\r\n|\r|\n/);
        if (lines.length < 2) return null;

        const sequence = lines[0];
        const timestamp = lines[1];
        const text = lines.slice(2).join('\n');

        if (!/^\d+$/.test(sequence) || !timestamp.includes('-->')) {
            return null;
        }

        return { id: index, sequence, timestamp, text };
    }).filter((line): line is SrtLine => line !== null);
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (selectedFile.type !== 'application/x-subrip' && !selectedFile.name.endsWith('.srt')) {
        setError('Invalid file type. Please upload a .srt file.');
        setFile(null);
        setFileContent('');
        return;
    }
    setError(null);
    setEditableLines([]);
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.onerror = () => {
        setError("Failed to read the file.");
    }
    reader.readAsText(selectedFile);
  }, []);

  const handleLineChange = (index: number, newText: string) => {
    setEditableLines(prev => {
        const newLines = [...prev];
        newLines[index] = { ...newLines[index], text: newText };
        return newLines;
    });
  };

  const handleTranslate = async () => {
    if (!fileContent) {
      setError('No file content to translate.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditableLines([]);

    try {
      const result = await translateSrt(fileContent, targetLanguage);
      const parsed = parseSrt(result);
      if (parsed.length === 0 && result.trim().length > 0) {
        setError("Failed to parse the translated SRT content. The format may be invalid.");
      } else {
        setEditableLines(parsed);
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const isTranslateDisabled = useMemo(() => !file || isLoading, [file, isLoading]);

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4 bg-grid-gray-700/[0.2]">
      <div className="w-full max-w-2xl mx-auto bg-base-200/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">SRT Translator</h1>
          <p className="text-gray-400 mt-2">Translate your subtitle files with AI precision.</p>
        </div>

        {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        <div className="space-y-6">
          <FileUpload onFileSelect={handleFileSelect} selectedFile={file} disabled={isLoading} />
          <LanguageSelector selectedLanguage={targetLanguage} onLanguageChange={setTargetLanguage} disabled={isLoading} />
          
          <button
            onClick={handleTranslate}
            disabled={isTranslateDisabled}
            className="w-full flex items-center justify-center p-4 text-lg bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isLoading ? <LoadingSpinner /> : <TranslateIcon />}
            <span className="ml-2">{isLoading ? 'Translating...' : 'Translate'}</span>
          </button>
        </div>

        {editableLines.length > 0 && file && (
          <EditableResultDisplay lines={editableLines} onLineChange={handleLineChange} fileName={file.name} targetLanguage={targetLanguage}/>
        )}
      </div>
    </div>
  );
}

export default App;
