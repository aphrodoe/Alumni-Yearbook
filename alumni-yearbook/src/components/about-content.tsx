import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function AboutContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleDropdown = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "What is this portal about?",
      answer:
        "This portal allows you to upload memories-photos to be featured in your yearbook. It also allows you to send heartfelt messages to your batchmates and juniors and interact using some fun polls.",
    },
    {
      question: "What will the yearbook 2025 contain?",
      answer:
        "The yearbook 2025 is a time capsule of your unforgettable journey at IITJ. It will feature your photo and some quirky infomation about you. Relive the best moments of hostel and campus life, captured through candid snapshots and batch photoshoot images. Most importantly, it will hold heartfelt messages from your batchmates-words that will bring back memories long after graduation. This yearbook isn't just a book, it's your IITJ story, preserved forever.",
    },
    {
      question: "What is the feed section about?",
      answer:
        "The feed is a space where you can reflect on the little moments that make up life at IIT Jodhpur — through simple, relatable polls. From midnight mess runs to the struggle of 8 a.m. lectures, it’s a place to capture what it feels like to be here, right now. One day, you might look back and smile at these small, shared memories.",
    },
    {
      question: "Where can i add my photos for the yearbook?",
      answer:
        "You can add your photos in the 'Upload memories' section of the portal. You can upload your candid photos, batch photoshoot images, and any other memorable moments you want to include in the yearbook.",
    },
    {
      question: "Can I message my batchmates and juniors?",
      answer:
        "Absolutely! You can send messages to your batchmates and juniors anytime. Your messages will be preserved and included in their yearbook, making them a lasting part of their graduation memories and adding an extra layer of meaning to their graduation celebrations. Whether it's a heartfelt note, words of encouragement, or a fun memory, your message will be a keepsake they'll treasure forever.",
    },
    {
      question: "How will I receive my yearbook?",
      answer:
        "You will receive your digital yearbook on your graduation day! It will be unlocked and available for you to access on the website, filled with your personal photos, and heartfelt messages from batchmates and juniors. It's a surprise waiting to be unveiled, capturing the best moments of your time at IITJ, and you can cherish it forever!",
    },
  ];

  return (

      <div className="max-w-6xl mx-auto p-6 space-y-8 rounded-lg">
        {/* Logo Section */}
        <div className="flex justify-between items-center">
          <a 
            href="https://iitj.ac.in/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="relative w-20 h-20 sm:w-40 sm:h-40"
          >
            <Image
              src="/IITJ_logo.png"
              alt="IITJ Logo"
              fill
              className="object-contain hover:opacity-80 transition-opacity"
            />
          </a>

          <h1 className="text-3xl sm:text-6xl font-bold text-blue-900">YEARBOOK 2025</h1>

          <a 
  href="https://saa.iitj.ac.in/home.html" 
  target="_blank" 
  rel="noopener noreferrer" 
  className="relative w-20 h-20 sm:w-40 sm:h-40"
>
  <Image
    src="/SAA_logo.png"
    alt="SAA Logo"
    fill
    className="object-contain hover:opacity-80 transition-opacity"
  />
</a>

        </div>

        {/* Heading Section */}
        <div className="text-center mt-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-blue-900 mb-4">
            Welcome to the{" "}
            <span className="italic text-3xl sm:text-5xl text-blue-700">YEARBOOK</span>
          </h1>

          <p className="text-lg text-gray-700 leading-relaxed">
            A yearbook is not just a collection of photos and names—it's a time capsule of unforgettable moments, friendships, and achievements that define your journey. It captures the late-night coding marathons, thrilling project successes, endless brainstorming sessions, birthday bashes, and the camaraderie that made it all worthwhile. It's a tribute to the challenges you conquered, the knowledge you gained, and most importantly, the friends you made and the memories you created along the way. This website, an initiative by the{" "}
            <a 
              href="https://saa.iitj.ac.in/home.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Society of Alumni Affairs, IIT Jodhpur
            </a>
            , aims to digitize the traditional yearbook experience for a technical college—preserving the spirit of these formative years in a way that lasts forever. Years from now, when you flip through its pages, it won't just remind you of what you studied, but of the people, experiences, and lessons that shaped your future.
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