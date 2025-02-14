interface ErrorMessageProps {
  message: string;
  retry?: () => void;
}

export function ErrorMessage({ message, retry }: ErrorMessageProps) {
  return (
    <div className="text-center p-4">
      <p className="text-red-600 mb-4">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="text-yellow-600 hover:text-yellow-700 underline"
        >
          Try Again
        </button>
      )}
    </div>
  );
}