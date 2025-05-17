'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ThumbsUp, Award, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  _id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
}

const SparkleEffect = () => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 1.5, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-10"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-yellow-400" />
      </div>
    </motion.div>
  );
};

const PollComponent = ({ poll, onVote }: { poll: Poll; onVote: () => void }) => {
  const [voted, setVoted] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const { data: session } = useSession();
  
  // Check if user has already voted
  useEffect(() => {
    const checkVoteStatus = async () => {
      if (session?.user?.email) {
        try {
          const response = await axios.get(`/api/polls/check-vote?pollId=${poll._id}&userEmail=${session.user.email}`);
          if (response.data.hasVoted) {
            setVoted(true);
            setSelectedOption(response.data.optionId);
          }
        } catch (error) {
          console.error('Error checking vote status:', error);
        }
      }
    };
    
    checkVoteStatus();
  }, [poll._id, session?.user?.email]);

  const handleVote = async (optionId: string) => {
    setIsAnimating(true);
    setShowSparkle(true);
    
    try {
      await axios.post('/api/polls/vote', {
        pollId: poll._id,
        optionId,
        userEmail: session?.user?.email,
        previousVote: selectedOption
      });
      
      // Always show sparkle effect when voting
      setShowSparkle(true);
      confetti({
        particleCount: 50, // Reduced for vote changes
        spread: 45,
        origin: { y: 0.6 }
      });
      
      setVoted(true);
      setSelectedOption(optionId);
      
      // Larger confetti only for first vote
      if (!voted) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      onVote();
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      // Reset animation states after a delay
      setTimeout(() => {
        setIsAnimating(false);
        setShowSparkle(false);
      }, 1000);
    }
  };

  const calculatePercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };
  
  // Find the most voted option
  const getMostVotedOption = () => {
    if (poll.totalVotes === 0) return null;
    return poll.options.reduce((prev, current) => 
      (prev.votes > current.votes) ? prev : current
    );
  };
  
  const mostVoted = getMostVotedOption();
  
  // Get a fun emoji based on the option text
  const getOptionEmoji = (text: string) => {
    const lowercaseText = text.toLowerCase();
    if (lowercaseText.includes('canteen') || lowercaseText.includes('dosa') || lowercaseText.includes('maggi')) return '🍽️';
    if (lowercaseText.includes('library') || lowercaseText.includes('study')) return '📚';
    if (lowercaseText.includes('sleep') || lowercaseText.includes('nap')) return '😴';
    if (lowercaseText.includes('coffee')) return '☕';
    if (lowercaseText.includes('first year')) return '🌱';
    if (lowercaseText.includes('final year')) return '🎓';
    return '✨';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow"
    >
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
        {poll.question}
      </h3>
      
      <div className="space-y-3">
        {poll.options.map((option) => (
          <motion.div 
            key={option.id} 
            className="w-full"
            whileHover={{ scale: voted ? 1 : 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {voted ? (
              <motion.div className="relative h-10 border rounded-md overflow-hidden">
                {/* Background bar representing percentage */}
                <motion.div 
                  className={`absolute h-full ${
                    selectedOption === option.id 
                      ? 'bg-blue-600' 
                      : 'bg-blue-100'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${calculatePercentage(option.votes)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ minWidth: '10px' }}
                />
                
                {/* Text container with full width */}
                <div className="absolute inset-0 flex items-center justify-between px-4 w-full cursor-pointer" 
                  onClick={() => handleVote(option.id)}
                >
                  <span className={`flex items-center ${selectedOption === option.id ? 'text-white' : 'text-black'}`}>
                    {getOptionEmoji(option.text)} <span className="ml-2">{option.text}</span>
                    {mostVoted && mostVoted.id === option.id && (
                      <Award className="h-4 w-4 ml-2 text-yellow-500" />
                    )}
                  </span>
                  <span className="text-sm ml-2 font-medium">
                    {calculatePercentage(option.votes)}%
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.button
                onClick={() => handleVote(option.id)}
                className="w-full text-left p-3 border border-gray-300 rounded-md hover:bg-blue-50 transition flex items-center justify-between group relative overflow-hidden"
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center">
                  {getOptionEmoji(option.text)} <span className="ml-2">{option.text}</span>
                </span>
                <ThumbsUp className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                <AnimatePresence>
                  {showSparkle && selectedOption === option.id && <SparkleEffect />}
                </AnimatePresence>
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
      
      <motion.div 
        className="mt-4 text-sm text-gray-500 flex items-center"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <Zap className="h-4 w-4 mr-1 text-blue-500" />
        Total votes: {poll.totalVotes}
      </motion.div>
      
      {voted && (
        <motion.div 
          className="mt-4 text-sm text-green-600 font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Thanks for voting! 
        </motion.div>
      )}
    </motion.div>
  );
};

export default PollComponent;
