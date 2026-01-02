// // components/layout/mobile-bottom-nav.tsx
// 'use client'

// import { 
//   Home, 
//   TrendingUp, 
//   PlusCircle, 
//   MessageCircle, 
//   User,
//   Search,
//   Bell,
//   Bookmark
// } from 'lucide-react'
// import { useAuth } from '@/contexts/AuthContext'
// import { usePathname } from 'next/navigation'
// import { useState } from 'react'

// export function MobileBottomNav() {
//   const { user } = useAuth()
//   const pathname = usePathname()
//   const [activeTab, setActiveTab] = useState(pathname)
  
//   const navItems = [
//     { icon: Home, label: 'Home', href: '/' },
//     { icon: TrendingUp, label: 'Trending', href: '/trending' },
//     { icon: Search, label: 'Search', href: '/search' },
//     { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
//     { icon: Bell, label: 'Notifications', href: '/notifications' },
//   ]

//   const handleNavigation = (href: string) => {
//     setActiveTab(href)
//     window.location.href = href
//   }

//   return (
//     <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 lg:hidden">
//       <div className="flex justify-around items-center p-2">
//         {navItems.slice(0, 2).map((item) => {
//           const Icon = item.icon
//           const isActive = activeTab === item.href
//           return (
//             <button
//               key={item.label}
//               onClick={() => handleNavigation(item.href)}
//               className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${
//                 isActive 
//                   ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
//                   : 'text-muted-foreground hover:text-foreground hover:bg-accent'
//               }`}
//             >
//               <Icon className="h-5 w-5" />
//               <span className="text-[10px] font-medium">{item.label}</span>
//             </button>
//           )
//         })}

//         {/* Ask Question - Prominent Center Button */}
//         <div className="relative -top-4">
//           <button
//             onClick={() => handleNavigation('/ask')}
//             className="flex flex-col items-center gap-1 p-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
//           >
//             <PlusCircle className="h-6 w-6" />
//           </button>
//         </div>

//         {navItems.slice(2, 4).map((item) => {
//           const Icon = item.icon
//           const isActive = activeTab === item.href
//           return (
//             <button
//               key={item.label}
//               onClick={() => handleNavigation(item.href)}
//               className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${
//                 isActive 
//                   ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
//                   : 'text-muted-foreground hover:text-foreground hover:bg-accent'
//               }`}
//             >
//               <Icon className="h-5 w-5" />
//               <span className="text-[10px] font-medium">{item.label}</span>
//             </button>
//           )
//         })}

//         {/* AI Chat or Profile */}
//         <button
//           onClick={() => handleNavigation(user ? '/chat' : '/login')}
//           className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${
//             activeTab === '/chat' 
//               ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' 
//               : 'text-muted-foreground hover:text-foreground hover:bg-accent'
//           }`}
//         >
//           <MessageCircle className="h-5 w-5" />
//           <span className="text-[10px] font-medium">AI</span>
//         </button>
//       </div>
//     </div>
//   )
// }