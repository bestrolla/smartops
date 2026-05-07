import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <div className="px-6 pb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Testimonios</h2>

      <div className="space-y-4">
        {testimonials.map((testimonial, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback>{testimonial.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-gray-600 text-sm mb-2">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}