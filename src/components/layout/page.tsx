import { ChevronRight } from "lucide-react";

type PageProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function Page({ title, description, children, actions }: PageProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <nav className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <span>NeuraX AI</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-300">{title}</span>
          </nav>
          <h1 className="text-2xl font-semibold tracking-normal text-white md:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
