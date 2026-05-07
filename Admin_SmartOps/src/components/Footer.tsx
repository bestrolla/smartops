export function Footer() {
    return (
      <footer className="px-6 py-4 border-t border-gray-200 bg-transparent">
        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <span>© 2025, made with</span>
            <span className="text-red-500">❤️</span>
            <span>by</span>
            <a
              href="https://www.smartopsve.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              SmartOps VE
            </a>
            <span>for a better web.</span>
          </div>
  
          <div className="flex items-center space-x-6 mt-2 md:mt-0">
            <a
              href="https://www.smartopsve.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-600 transition-colors"
            >
              SmartOps VE
            </a>
            <a
              href="https://www.creative-tim.com/presentation"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-600 transition-colors"
            >
              About Us
            </a>
            <a
              href="https://www.creative-tim.com/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-600 transition-colors"
            >
              Blog
            </a>
            <a
              href="https://www.creative-tim.com/license"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-600 transition-colors"
            >
              License
            </a>
          </div>
        </div>
      </footer>
    )
  }
  