import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FeedContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleDropdown = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "What is this website about?",
      answer:
        "This website allows you to upload memories -- photos and quotes to be featured in your yearbook. It also allows you to send heartfelt messages to your batchmates and juniors.",
    },
    {
      question: "What will the yearbook 2025 contain?",
      answer:
        "The yearbook 2025 is a time capsule of your unforgettable journey at IITJ. It will feature your photo, inspiring quotes, and personal reflections on your time at the institute. Relive the best moments of hostel and campus life, captured through candid snapshots and batch photoshoot images. Most importantly, it will hold heartfelt messages from your batchmates--words that will bring back memories long after graduation. This yearbook isn't just a book, it's your IITJ story, preserved forever.",
    },
    {
      question: "Can I message my batchmates and juniors?",
      answer:
        "Absolutely! You can send messages to your batchmates and juniors anytime. Your messages will be preserved and included in their yearbook, making them a lasting part of their graduation memories and adding an extra layer of meaning to their graduation celebrations. Whether it's a heartfelt note, words of encouragement, or a fun memory, your message will be a keepsake they'll treasure forever.",
    },
    {
      question: "How will I receive my yearbook?",
      answer:
        "You will receive your digital yearbook on your graduation day! It will be unlocked and available for you to access on the website, filled with your personal photos, quotes, and heartfelt messages from batchmates and juniors. It's a surprise waiting to be unveiled, capturing the best moments of your time at IITJ, and you can cherish it forever!",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Logo Section */}
      <div className="flex justify-between items-center">
        <div className="relative w-40 h-40"> {/* Enlarged to 200% */}
          <Image
            src="/IITJ_logo.png"
            alt="IITJ Logo"
            fill
            className="object-contain"
          />
        </div>
        <div className="relative w-40 h-40"> {/* Enlarged to 200% */}
          <Image
            src="/SAA_logo.png"
            alt="SAA Logo"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Heading Section */}
      <div className="text-center mt-6">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-4">
          Welcome to the{" "}
          <span className="italic text-5xl text-blue-700">YEARBOOK</span>
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          A yearbook is not just a collection of photos and names—it’s a time
          capsule of unforgettable moments, friendships, and achievements that
          define your journey. It captures the late-night coding marathons,
          thrilling project successes, endless brainstorming sessions, birthday
          bashes, and the camaraderie that made it all worthwhile. It’s a
          tribute to the challenges you conquered, the knowledge you gained,
          and most importantly, the friends you made along the way, and the
          memories you created along the way. Years from now, when you flip
          through its pages, it won’t just remind you of what you studied, but
          of the people, experiences, and lessons that shaped your future.
        </p>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-blue-900 text-center">FAQs</h2>
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-blue-300 overflow-hidden shadow-md"
          >
            <button
              onClick={() => toggleDropdown(index)}
              className="w-full flex justify-between items-center px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold transition-colors"
            >
              <span>{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            {openIndex === index && (
              <div className="px-4 py-3 bg-blue-50 text-gray-700">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}