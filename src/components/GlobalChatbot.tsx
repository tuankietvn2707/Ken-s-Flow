import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, FileText, Download } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { Transaction, Goal, TransactionType, Student, ClassSession } from '../types';
import { formatNumber } from './PersonalFinance';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Props {
  transactions: Transaction[];
  goals: Goal[];
  students: Student[];
  classes: ClassSession[];
  addTransaction: (t: Transaction) => Promise<void>;
  addStudent: (s: Student) => void;
  updateStudent: (s: Student) => void;
  deleteStudent: (id: string) => void;
  addClass: (c: ClassSession) => Promise<void> | void;
  updateClass: (c: ClassSession) => Promise<void> | void;
  deleteClass: (id: string) => Promise<void> | void;
  deleteTransaction: (id: string) => Promise<void> | void;
  addGoal: (g: Goal) => Promise<void>;
  updateGoal: (g: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isAction?: boolean;
  isTyping?: boolean;
}

const TypingMessage = ({ text, onComplete, onUpdate }: { text: string, onComplete: () => void, onUpdate: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const safeText = text || '';
    const interval = setInterval(() => {
      setDisplayedText(safeText.slice(0, i + 1));
      i++;
      if (i % 2 === 0) onUpdate();
      if (i >= safeText.length) {
        clearInterval(interval);
        onUpdate();
        onComplete();
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text, onComplete, onUpdate]);

  const formatText = (str: string) => {
    return str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  return <span dangerouslySetInnerHTML={{ __html: formatText(displayedText) }} />;
};

export default function GlobalChatbot({ 
  transactions, goals, students, classes, 
  addTransaction, addStudent, updateStudent, deleteStudent,
  addClass, updateClass, deleteClass, deleteTransaction,
  addGoal, updateGoal, deleteGoal
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Chào bạn! Mình là trợ lý AI. Mình có thể giúp gì cho bạn hôm nay (về học viên, lịch học hay tài chính)?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 20:00 Auto Summary
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 20 && now.getMinutes() === 0) {
        const today = now.toISOString().split('T')[0];
        const todayTxs = transactions.filter(t => (t.date || '') === today);
        const todayIncome = todayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
        const todayExpense = todayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
        
        setMessages(prev => {
          // Prevent duplicate messages if it runs multiple times in the same minute
          const hasNotified = prev.some(m => m.text.includes('Tổng kết ngày') && new Date(parseInt(m.id)).getDate() === now.getDate());
          if (hasNotified) return prev;
          
          setIsOpen(true);
          return [...prev, {
            id: Date.now().toString(),
            sender: 'ai',
            text: `🔔 Tổng kết ngày: Hôm nay bạn đã chi ${formatNumber(todayExpense)}đ, và có khoản thu ${formatNumber(todayIncome)}đ. Bạn có muốn cập nhật thêm gì không?`,
            isTyping: true
          }];
        });
      }
    };

    // Calculate time until next minute to align checks
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000;
    
    let interval: NodeJS.Timeout;
    const timeout = setTimeout(() => {
      checkTime(); // check at the start of the minute
      interval = setInterval(checkTime, 60000); // then every minute
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [transactions]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Context for AI
      const systemInstruction = `
Bạn là trợ lý AI thông minh, quản lý cả học viên, lịch dạy học và tài chính cá nhân.
Dữ liệu hiện tại của người dùng:
- Giao dịch gần đây: ${JSON.stringify(transactions.slice(0, 50))}
- Mục tiêu tiết kiệm: ${JSON.stringify(goals)}
- Học viên hiện tại: ${JSON.stringify(students.map(s => ({id: s.id, name: s.name, phone: s.phone, currentSubject: s.currentSubject})))}
- Lịch học: ${JSON.stringify(classes.slice(0, 20).map(c => ({id: c.id, studentId: c.studentId, date: c.date, time: c.time, status: c.status})))}

QUY TẮC QUAN TRỌNG:
1. NẾU người dùng yêu cầu thực hiện thao tác Thêm/Sửa/Xóa (Học viên, Lịch học, Giao dịch, Mục tiêu), bạn PHẢI phân tích và trả về DUY NHẤT một chuỗi JSON hợp lệ, KHÔNG có markdown hay văn bản nào khác.
Cấu trúc JSON: {"action": "<tên_hành_động>", "data": { <dữ liệu tương ứng> }}

Các action hỗ trợ:
- "add_transaction": {"type": "expense" | "income", "source": "cash" | "banking", "amount": number, "description": "string", "category": "string"}
- "add_student": {"name": "string", "phone": "string", "email": "string", "fee": number, "currentSubject": "string", "parentDetails": "string"}
- "add_class": {"studentId": "string", "date": "YYYY-MM-DD", "time": "HH:MM", "duration": number, "status": "scheduled" | "completed" | "cancelled", "notes": "string"}
- "update_class": {"id": "string", "status": "scheduled" | "completed" | "cancelled"}

* Chú ý: NẾU thông tin chưa đủ (ví dụ thiếu mã học viên, số tiền), KHÔNG trả về JSON. Thay vào đó hãy đặt câu hỏi văn bản để hỏi người dùng lấy thêm chi tiết. Để tìm studentId, hãy dựa vào tên trong danh sách.

2. NẾU người dùng hỏi thông tin (VD: học viên, lịch học, báo cáo tài chính, tổng thu chi):
Hãy trả lời như một người trợ lý đắc lực, dựa vào phân tích từ dữ liệu JSON được cung cấp. Trả lời chi tiết nhưng súc tích, dễ hiểu, dùng emoji để sinh động. KHÔNG trả về JSON.
      `;

      const callGemini = async () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing_GEMINI_API_KEY");
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: text,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        });
        return response.text || '';
      };

      const callOpenAI = async () => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("Missing_OPENAI_API_KEY");
        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: text }
          ],
          temperature: 0.7,
        });
        return response.choices[0].message.content || '';
      };

      let reply = '';
      let usedModel = '';

      try {
        // Try Gemini first
        reply = await callGemini();
        usedModel = 'Gemini';
      } catch (geminiError: any) {
        const errStr = geminiError?.message || String(geminiError);
        const isQuotaOrMissing = errStr.includes('429') || errStr.includes('Quota') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('503') || errStr.includes('Missing_GEMINI_API_KEY');
        
        if (isQuotaOrMissing) {
          console.warn('Gemini failed or missing, falling back to OpenAI...', errStr);
          try {
            reply = await callOpenAI();
            usedModel = 'ChatGPT';
          } catch (openAiError: any) {
            const oaErrStr = openAiError?.message || String(openAiError);
            if (errStr.includes('Missing_GEMINI_API_KEY') && oaErrStr.includes('Missing_OPENAI_API_KEY')) {
                throw new Error("Chưa cấu hình GEMINI_API_KEY hoặc OPENAI_API_KEY. Vui lòng thêm biến môi trường.");
            }
            throw new Error(`Cả Gemini và ChatGPT đều gặp lỗi hoặc hết lượt.\nGemini: ${errStr}\nChatGPT: ${oaErrStr}`);
          }
        } else {
          throw geminiError;
        }
      }
      
      // Clean up potential markdown if AI accidentally includes it for JSON
      if (reply.startsWith('\`\`\`json')) {

        reply = reply.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
      } else if (reply.startsWith('\`\`\`')) {
        reply = reply.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
      }

      // Check if reply is a JSON action
      try {
        const trimmedReply = reply.trim();
        if (trimmedReply.startsWith('{') && trimmedReply.endsWith('}')) {
          const parsed = JSON.parse(trimmedReply);
          const action = parsed.action;
          const data = parsed.data;
          
          let aiResponseText = `Đã thực hiện xong thao tác.`;

          if (action === 'add_transaction') {
            const newTx: Transaction = {
              id: Date.now().toString(),
              type: data.type,
              source: data.source || 'cash',
              amount: data.amount,
              description: data.description,
              category: data.category,
              date: new Date().toISOString().split('T')[0],
            };
            await addTransaction(newTx);
            aiResponseText = `Đã tự động thêm giao dịch: ${data.type === 'income' ? 'Thu' : 'Chi'} ${formatNumber(data.amount)}đ từ ${data.source === 'cash' ? 'Tiền mặt' : 'Ngân hàng'} cho "${data.description}". (${usedModel})`;
          } else if (action === 'add_student') {
             const newStudent: Student = {
                id: Date.now().toString(),
                name: data.name,
                phone: data.phone || '',
                email: data.email || '',
                fee: data.fee,
                currentSubject: data.currentSubject || '',
                parentDetails: data.parentDetails || '',
                joinDate: new Date().toISOString().split('T')[0]
             };
             addStudent(newStudent);
             aiResponseText = `Đã thêm học viên mới: ${data.name} (Học phí: ${formatNumber(data.fee)}đ). (${usedModel})`;
          } else if (action === 'add_class') {
             const newClass: ClassSession = {
                id: Date.now().toString(),
                studentId: data.studentId,
                date: data.date,
                time: data.time || '18:00',
                duration: data.duration || 60,
                status: data.status || 'scheduled',
                notes: data.notes || '',
                isPaid: false
             };
             await addClass(newClass);
             const sName = students.find((s: Student) => s.id === data.studentId)?.name || 'Học viên';
             aiResponseText = `Đã lên lịch học cho ${sName} vào ${data.date} ${data.time}. (${usedModel})`;
          } else if (action === 'update_class') {
             const cls = classes.find((c: ClassSession) => c.id === data.id);
             if (cls) {
                await updateClass({...cls, status: data.status || 'completed'});
                aiResponseText = `Đã cập nhật trạng thái lớp học thành ${data.status}. (${usedModel})`;
             } else {
                aiResponseText = `Không tìm thấy lớp học yêu cầu cập nhật. (${usedModel})`;
             }
          }
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'ai',
            text: aiResponseText,
            isTyping: true
          }]);
          return;
        }
      } catch (e) {
        // Not JSON or invalid JSON, just normal text.
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: reply, isTyping: true }]);

    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorMessage = 'Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn.';
      const errorString = error?.message || String(error);
      
      if (errorString.includes('Cả Gemini và ChatGPT đều gặp lỗi')) {
        errorMessage = errorString;
      } else if (errorString.includes('Chưa cấu hình')) {
        errorMessage = errorString;
      } else {
        errorMessage = `Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Chi tiết: ${errorString}`;
      }

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'ai', 
        text: errorMessage,

        isTyping: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action === 'Báo cáo tuần') {
      handleSend('Hãy tóm tắt thu chi của tôi trong 7 ngày qua.');
    } else if (action === 'Xuất CSV') {
      // Trigger export from parent or just tell user how
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: 'Bạn có thể nhấn nút "Xuất CSV" ở phần Lịch Sử Giao Dịch nhé!', isTyping: true }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 glass-panel rounded-2xl shadow-2xl border border-sky-300/30 overflow-hidden flex flex-col"
            style={{ height: '500px', maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <span className="font-semibold">Trợ lý Trí tuệ nhân tạo (AI)</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/20 h-8 w-8 text-white rounded-full transition-colors">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sky-50/40 custom-scrollbar">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.sender === 'user' 
                      ? 'bg-blue-500 text-white rounded-br-sm' 
                      : 'glass-panel border border-sky-300/30 rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.sender === 'ai' ? (
                      msg.isTyping ? (
                        <TypingMessage 
                          text={msg.text} 
                          onComplete={() => {
                            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isTyping: false } : m));
                          }}
                          onUpdate={scrollToBottom}
                        />
                      ) : (
                        <span dangerouslySetInnerHTML={{ __html: (msg.text || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
                      )
                    ) : (
                      msg.text || ''
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass-panel border border-sky-300/30 p-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-white/50 border-t border-sky-100 flex gap-2 overflow-x-auto custom-scrollbar">
              <Button variant="secondary" size="sm" onClick={() => handleQuickAction('Báo cáo tuần')} className="whitespace-nowrap rounded-full text-xs h-8">
                <FileText className="w-3 h-3 mr-1" /> TT Tài chính
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleSend('Hôm nay tôi có lịch dạy học viên nào không?')} className="whitespace-nowrap rounded-full text-xs h-8">
                <FileText className="w-3 h-3 mr-1" /> Lịch dạy hôm nay
              </Button>
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-sky-100 rounded-b-3xl">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="rounded-full bg-sky-50"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="rounded-full w-10 h-10 flex-shrink-0"
                >
                  <Send className="w-4 h-4 ml-1" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-transform h-14 w-14"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </Button>
    </div>
  );
}

