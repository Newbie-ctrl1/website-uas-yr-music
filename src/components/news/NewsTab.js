import { Newspaper, Calendar, ExternalLink } from 'lucide-react';
import Image from 'next/image';

export default function NewsTab() {
  const dummyNews = [
    {
      id: 1,
      title: "Konser Dewa 19 Reunion Tour 2024",
      date: "2024-02-15",
      image: "/images/news/dewa19.jpg",
      content: "Dewa 19 akan menggelar konser reunion tour di beberapa kota besar Indonesia sepanjang tahun 2024.",
      category: "Konser"
    },
    {
      id: 2,
      title: "Festival Musik Jazz Terbesar di Indonesia",
      date: "2024-03-20",
      image: "/images/news/jazz.jpg",
      content: "Jakarta International Jazz Festival 2024 akan menghadirkan musisi jazz internasional.",
      category: "Festival"
    },
    {
      id: 3,
      title: "Coldplay Akan Gelar Konser di Indonesia",
      date: "2024-04-10",
      image: "/images/news/coldplay.jpg",
      content: "Band legendaris Coldplay mengumumkan akan menggelar konser di Jakarta pada tahun 2024.",
      category: "Konser"
    }
  ];

  return (
    <div className="bg-gradient-to-b from-purple-300 via-purple-100 to-white/50 min-h-screen p-8 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
            Berita & Informasi Event
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Dapatkan informasi terbaru seputar event musik dan hiburan
          </p>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dummyNews.map((news) => (
            <div
              key={news.id}
              className="bg-white/80 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-purple-100"
            >
              <div className="relative h-48 bg-gradient-to-br from-purple-200 to-purple-100">
                <Image
                  src={news.image}
                  alt={news.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-white/90 text-sm font-medium text-purple-600 border border-purple-200">
                    {news.category}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {news.title}
                </h3>
                
                <div className="flex items-center text-gray-600 mb-4">
                  <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                  <span className="text-sm">
                    {new Date(news.date).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {news.content}
                </p>

                <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium">
                  <span>Baca selengkapnya</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 