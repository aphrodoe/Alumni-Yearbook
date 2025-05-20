import Image from "next/image";

interface TeamMemberProps {
  name: string;
  photoUrl: string;
  linkedinUrl: string;
}

const TeamMember = ({ name, photoUrl, linkedinUrl }: TeamMemberProps) => (
  <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
    <a
      href={linkedinUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="cursor-pointer transition-transform hover:scale-105"
    >
      <div className="relative w-48 h-48 mb-6">
        <div className="absolute inset-0 rounded-full bg-gray-200" />
        <Image
          src={photoUrl}
          alt={name}
          fill
          className="rounded-full object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <h3 className="text-xl font-semibold text-blue-900 hover:text-blue-600">
        {name}
      </h3>
    </a>
  </div>
);

export function TeamSection() {
  const developers = [
    {
      name: "Akhil Dhyani",
      photoUrl: "/Akhil_Dhyani.jpg",
      linkedinUrl: "https://www.linkedin.com/in/akhil-dhyani-b39a37312/",
    },
    {
      name: "Divyansh Yadav",
      photoUrl: "/Divyansh_Yadav.jpg",
      linkedinUrl: "https://www.linkedin.com/in/divyansh-yadav-b17b2b328/",
    },
  ];

  const designers = [
    {
      name: "Sumedha Singh",
      photoUrl: "/Sumedha_Singh.jpg",
      linkedinUrl: "https://www.linkedin.com/in/sumedha-singh-304169316/",
    },
  ];

  const mentors = [
    {
      name: "Raghuveer Kulkarni",
      photoUrl: "/Raghuveer_Kulkarni.jpeg",
      linkedinUrl: "https://www.linkedin.com/in/raghuveer-kulkarni-185450281/",
    },
    {
      name: "Aditya Jha",
      photoUrl: "/Aditya_Jha.jpeg",
      linkedinUrl: "https://www.linkedin.com/in/aditya-jha-14b972287/",
    },
    {
      name: "Danie George John",
      photoUrl: "/Danie_George_John.jpeg",
      linkedinUrl: "https://www.linkedin.com/in/daniegeorgejohn/",
    },
    {
      name: "Tanmay Daga",
      photoUrl: "/Tanmay_Daga.jpeg",
      linkedinUrl: "https://www.linkedin.com/in/01tanmaydaga/",
    },
    {
      name: "Nayan Kute",
      photoUrl: "/Nayan_Kute.jpeg",
      linkedinUrl: "https://www.linkedin.com/in/nayan-kute-a1b998284/",
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Content Container */}
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          <h1 className="text-4xl font-bold text-blue-900 text-center mb-8">
            Meet The Team
          </h1>

          {/* Developers Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-blue-800 border-b border-blue-200 pb-2">
              Developers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {developers.map((dev, index) => (
                <TeamMember
                  key={index}
                  name={dev.name}
                  photoUrl={dev.photoUrl}
                  linkedinUrl={dev.linkedinUrl}
                />
              ))}
            </div>
          </div>

          {/* Designers Section */}
          <div className="space-y-6 mt-12">
            <h2 className="text-2xl font-semibold text-blue-800 border-b border-blue-200 pb-2">
              Designers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {designers.map((designer, index) => (
                <TeamMember
                  key={index}
                  name={designer.name}
                  photoUrl={designer.photoUrl}
                  linkedinUrl={designer.linkedinUrl}
                />
              ))}
            </div>
          </div>

          {/* Mentors Section */}
          <div className="space-y-6 mt-12">
            <h2 className="text-2xl font-semibold text-blue-800 border-b border-blue-200 pb-2">
              Mentors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mentors.map((mentor, index) => (
                <TeamMember
                  key={index}
                  name={mentor.name}
                  photoUrl={mentor.photoUrl}
                  linkedinUrl={mentor.linkedinUrl}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}