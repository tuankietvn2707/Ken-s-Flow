import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, FileText, Download } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { Transaction, Goal, TransactionType } from '../types';
import { formatNumber } from './PersonalFinance';

interface Props {
  transactions: Transaction[];
  goals: Goal[];
  addTransaction: (t: Transaction) => Promise<void>;
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

export default function FinanceChatbot({ transactions, goals, addTransaction }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Chào bạn! Mình là trợ lý tài chính AI. Mình có thể giúp gì cho bạn hôm nay?' }
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
      if (now.getHours() === 20 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        const today = now.toISOString().split('T')[0];
        const todayTxs = transactions.filter(t => (t.date || '') === today);
        const todayIncome = todayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
        const todayExpense = todayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'ai',
          text: `🔔 Tổng kết ngày: Hôm nay bạn đã chi ${formatNumber(todayExpense)}đ, và có khoản thu ${formatNumber(todayIncome)}đ. Bạn có muốn cập nhật thêm gì không?`,
          isTyping: true
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
      // Context for AI
      const systemInstruction = `
Bạn là trợ lý quản lý tài chính cá nhân thông minh, thân thiện và chuyên nghiệp.
Dữ liệu hiện tại của người dùng:
- Giao dịch gần đây: ${JSON.stringify(transactions.slice(0, 50))}
- Mục tiêu tiết kiệm: ${JSON.stringify(goals)}

QUY TẮC QUAN TRỌNG:
1. NẾU người dùng muốn THÊM GIAO DỊCH (ví dụ: "Nay tốn 15k tiền ăn sáng"):
   - Bạn PHẢI xác định được: Loại (thu/chi), Số tiền, Mô tả, và NGUỒN TIỀN (Tiền mặt hay Chuyển khoản/Ngân hàng).
   - NẾU người dùng CHƯA nói rõ nguồn tiền là tiền mặt hay chuyển khoản, bạn KHÔNG được trả về JSON. Thay vào đó, hãy hỏi lại: "Bạn sử dụng tiền mặt hay chuyển khoản ngân hàng cho giao dịch này?"
   - NẾU đã có đủ thông tin, chỉ trả về MỘT chuỗi JSON duy nhất, tuyệt đối không có markdown (\`\`\`json), không có text nào khác.
   - Định dạng JSON: {"action": "add_transaction", "data": {"type": "expense" | "income", "source": "cash" | "banking", "amount": number, "description": "string", "category": "string"}}

2. NẾU người dùng hỏi thông tin, tóm tắt, phân tích, hoặc trò chuyện bình thường:
   Hãy trả lời như một chuyên gia tài chính, phân tích số liệu từ dữ liệu JSON được cung cấp. Trả lời ngắn gọn, súc tích, dễ hiểu, có thể dùng emoji. KHÔNG trả về JSON trong trường hợp này.
      `;

      const callGemini = async () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing_GEMINI_API_KEY");
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
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
          if (parsed.action === 'add_transaction') {
            const newTx: Transaction = {
              id: Date.now().toString(),
              type: parsed.data.type,
              source: parsed.data.source || 'cash',
              amount: parsed.data.amount,
              description: parsed.data.description,
              category: parsed.data.category,
              date: new Date().toISOString().split('T')[0],
            };
            addTransaction(newTx);
            
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              sender: 'ai',
              text: `Đã tự động thêm giao dịch: ${parsed.data.type === 'income' ? 'Thu' : 'Chi'} ${formatNumber(parsed.data.amount)}đ từ ${parsed.data.source === 'cash' ? 'Tiền mặt' : 'Ngân hàng'} cho "${parsed.data.description}" (${parsed.data.category}). (Đã dùng ${usedModel})`,
              isTyping: true
            }]);
            return;
          }
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
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-sky-300/40 overflow-hidden flex flex-col"
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sky-50/40 custom-scrollbar">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.sender === 'user' 
                      ? 'bg-blue-500 text-white rounded-br-sm' 
                      : 'bg-white border border-sky-300/30 rounded-bl-sm shadow-sm'
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
                  <div className="bg-white border border-sky-300/30 p-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-white border-t border-sky-300/30 flex gap-2 overflow-x-auto custom-scrollbar">
              <button onClick={() => handleQuickAction('Báo cáo tuần')} className="whitespace-nowrap px-3 py-1.5 bg-cyan-50 text-cyan-600 text-xs font-medium rounded-full hover:bg-cyan-100 transition-colors flex items-center gap-1">
                <FileText className="w-3 h-3" /> Báo cáo tuần
              </button>
              <button onClick={() => handleQuickAction('Xuất CSV')} className="whitespace-nowrap px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1">
                <Download className="w-3 h-3" /> Xuất CSV
              </button>
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-sky-300/30">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-2 bg-sky-100/50 rounded-full text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
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

