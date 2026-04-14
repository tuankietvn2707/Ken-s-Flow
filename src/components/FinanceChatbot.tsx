import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, FileText, Download } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Transaction, Goal, formatNumber } from './PersonalFinance';

interface Props {
  transactions: Transaction[];
  goals: Goal[];
  setTransactions: (t: Transaction[]) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isAction?: boolean;
}

export default function FinanceChatbot({ transactions, goals, setTransactions }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Chào bạn! Mình là trợ lý tài chính AI. Mình có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 20:00 Auto Summary
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 20 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        const today = now.toISOString().split('T')[0];
        const todayTxs = transactions.filter(t => t.date === today);
        const todayIncome = todayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const todayExpense = todayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'ai',
          text: `🔔 Tổng kết ngày: Hôm nay bạn đã chi ${formatNumber(todayExpense)}đ, và có khoản thu ${formatNumber(todayIncome)}đ. Bạn có muốn cập nhật thêm gì không?`
        }]);
        setIsOpen(true);
      }
    };

    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [transactions]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'ai',
          text: 'Lỗi: Chưa cấu hình GEMINI_API_KEY. Vui lòng thêm biến môi trường này trên Vercel.'
        }]);
        setIsLoading(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
      // Context for AI
      const systemInstruction = `
Bạn là trợ lý quản lý tài chính cá nhân thông minh, thân thiện và chuyên nghiệp.
Dữ liệu hiện tại của người dùng:
- Giao dịch gần đây: ${JSON.stringify(transactions.slice(0, 50))}
- Mục tiêu tiết kiệm: ${JSON.stringify(goals)}

NHIỆM VỤ CỦA BẠN:
1. NẾU người dùng muốn THÊM GIAO DỊCH (ví dụ: "Nay tốn 15k tiền ăn sáng", "Vừa nhận lương 10 triệu"):
   BẮT BUỘC chỉ trả về MỘT chuỗi JSON duy nhất, tuyệt đối không có markdown (\`\`\`json), không có text nào khác.
   Định dạng JSON: {"action": "add_transaction", "data": {"type": "expense" | "income", "amount": number, "description": "string", "category": "string"}}

2. NẾU người dùng hỏi thông tin, tóm tắt, phân tích, hoặc trò chuyện bình thường (ví dụ: "Tóm tắt thu chi 7 ngày qua", "Tôi tiêu nhiều nhất vào đâu?"):
   Hãy trả lời như một chuyên gia tài chính, phân tích số liệu từ dữ liệu JSON được cung cấp. Trả lời ngắn gọn, súc tích, dễ hiểu, có thể dùng emoji. KHÔNG trả về JSON trong trường hợp này.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: text,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      let reply = response.text || '';
      
      // Clean up potential markdown if AI accidentally includes it for JSON
      if (reply.startsWith('\`\`\`json')) {
        reply = reply.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
      } else if (reply.startsWith('\`\`\`')) {
        reply = reply.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
      }

      // Check if reply is a JSON action
      try {
        const parsed = JSON.parse(reply.trim());
        if (parsed.action === 'add_transaction') {
          const newTx: Transaction = {
            id: Date.now().toString(),
            type: parsed.data.type,
            amount: parsed.data.amount,
            description: parsed.data.description,
            category: parsed.data.category,
            date: new Date().toISOString().split('T')[0],
          };
          setTransactions([newTx, ...transactions]);
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'ai',
            text: `Đã tự động thêm giao dịch: ${parsed.data.type === 'income' ? 'Thu' : 'Chi'} ${formatNumber(parsed.data.amount)}đ cho "${parsed.data.description}" (${parsed.data.category}).`
          }]);
          return;
        }
      } catch (e) {
        // Not JSON, just normal text. This is expected for conversational queries.
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: reply }]);

    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorMessage = 'Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn.';
      const errorString = error?.message || String(error);
      
      if (errorString.includes('429') || errorString.includes('Quota exceeded') || errorString.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'Lỗi từ Google Gemini: Tài khoản API của bạn đã vượt quá giới hạn số lượt dùng miễn phí (Quota exceeded).';
      } else {
        errorMessage = `Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Chi tiết: ${errorString}`;
      }

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'ai', 
        text: errorMessage
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
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: 'Bạn có thể nhấn nút "Xuất CSV" ở phần Lịch Sử Giao Dịch nhé!' }]);
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
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            style={{ height: '500px', maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <span className="font-semibold">Trợ lý Tài chính AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-blue-500 text-white rounded-br-sm' 
                      : 'bg-white border border-slate-100 rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto custom-scrollbar">
              <button onClick={() => handleQuickAction('Báo cáo tuần')} className="whitespace-nowrap px-3 py-1.5 bg-cyan-50 text-cyan-600 text-xs font-medium rounded-full hover:bg-cyan-100 transition-colors flex items-center gap-1">
                <FileText className="w-3 h-3" /> Báo cáo tuần
              </button>
              <button onClick={() => handleQuickAction('Xuất CSV')} className="whitespace-nowrap px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1">
                <Download className="w-3 h-3" /> Xuất CSV
              </button>
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-slate-100">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-2 bg-slate-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 bg-cyan-500 text-white rounded-full flex items-center justify-center hover:bg-cyan-600 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4 ml-1" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform focus:outline-none"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}

