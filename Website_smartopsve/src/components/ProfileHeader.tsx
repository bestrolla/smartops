import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileHeaderProps {
  name: string;
  title: string;
  description: string;
  avatar: string;
}

export function ProfileHeader({ name, title, description, avatar }: ProfileHeaderProps) {
  return (
    <div className="px-6 pt-12 pb-8 text-center">
      <div className="mb-6">
        <Avatar className="w-24 h-24 mx-auto mb-4">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
        </Avatar>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {name}
        </h1>

        <p className="text-gray-600 dark:text-gray-300 font-medium mb-4">
          {title}
        </p>

        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
}