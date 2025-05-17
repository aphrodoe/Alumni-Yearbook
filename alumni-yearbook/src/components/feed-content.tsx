'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import PollComponent from './poll-component';
import { ChevronUp, ChevronDown, BarChart2, Loader2, X } from 'lucide-react';
import ContactForm from './contact-form';

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

const FeedContent = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState<boolean>(true);
  const [showContactForm, setShowContactForm] = useState(false);

  const fetchPolls = async (preventScroll = false) => {
    try {
      // Only set loading if not preventing scroll
      if (!preventScroll) {
        setLoading(true);
      }
      const response = await axios.get('/api/polls');
      setPolls(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch polls');
      console.error(err);
    } finally {
      if (!preventScroll) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPolls(); // Initial load should show loading state
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold flex items-center">
          <BarChart2 className="mr-2 h-6 w-6 text-blue-500" />
          College Life Polls
        </h2>
        
      </motion.div>
      
      {error && (
        <motion.div 
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {error}
        </motion.div>
      )}
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader2 className="h-12 w-12 text-blue-500" />
          </motion.div>
          <motion.p 
            className="mt-4 text-gray-500"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            Loading your polls...
          </motion.p>
        </div>
      ) : polls.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className={expandedView ? "" : "grid grid-cols-1 md:grid-cols-2 gap-6"}
        >
          {polls.map((poll) => (
            <motion.div key={poll._id} variants={item}>
              <PollComponent 
                poll={poll} 
                onVote={() => fetchPolls(true)} // Pass true to prevent scroll
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          className="text-center py-20 text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-6xl mb-4">📊</div>
          <p>No polls available at the moment.</p>
        </motion.div>
      )}

      <motion.div 
        className="text-center py-12 mt-8 border-t border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-gray-600 mb-2">
          Have an interesting poll idea for your fellow batchmates?
        </p>
        <p className="text-gray-600">
          We'd love to hear it! {" "}
          <button 
            onClick={() => setShowContactForm(true)}
            className="text-blue-500 hover:text-blue-700 underline transition-colors"
          >
            Send us your poll idea
          </button>
          {" "}and we'll add it to the collection.
        </p>
      </motion.div>

      {showContactForm && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Close when clicking outside the modal
            if (e.target === e.currentTarget) {
              setShowContactForm(false);
            }
          }}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 relative"
          >
            <button
              onClick={() => setShowContactForm(false)}
              className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
            <ContactForm />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default FeedContent;
