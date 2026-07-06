export default function Card({ children, className = "", padding = "p-6", onClick }) {
     return (
          <div
               onClick={onClick}
               className={`bg-white rounded-xl border border-gray-100 shadow-sm ${padding} ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className}`}
          >
               {children}
          </div>
     );
}

function CardHeader({ children, className = "" }) {
     return <div className={`mb-4 ${className}`}>{children}</div>;
}

function CardTitle({ children, className = "" }) {
     return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>;
}

function CardContent({ children, className = "" }) {
     return <div className={className}>{children}</div>;
}

function CardFooter({ children, className = "" }) {
     return <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>{children}</div>;
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;
