import { Link } from "react-router-dom";

export function SelectProgramPrompt({ noPrograms, context, backLink }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-600">
        {noPrograms ? (
          <>
            Create and manage programs from the{" "}
            <Link
              to="/admin/programs"
              className="text-primary-600 hover:underline"
            >
              Programs
            </Link>{" "}
            page.
          </>
        ) : (
          `Select a program from the dropdown above to view ${context}.`
        )}
      </p>
      {backLink && (
        <Link
          to={backLink.to}
          className="text-primary-600 hover:underline mt-2 inline-block text-sm"
        >
          {backLink.label}
        </Link>
      )}
    </div>
  );
}
