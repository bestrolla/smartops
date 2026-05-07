import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  DollarSign,
  Calendar,
  Activity,
  Clock,
  MoreHorizontal,
  Bell,
  Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WebsiteViewsChart } from '@/components/charts/WebsiteViewsChart'
import { DailySalesChart } from '@/components/charts/DailySalesChart'
import { CompletedTasksChart } from '@/components/charts/CompletedTasksChart'
import { useAuth } from "../lib/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Mock data para las métricas
const metrics = [
  {
    title: "Today's Money",
    value: "$53k",
    icon: DollarSign,
    trend: "+55%",
    trendType: "up" as const,
    description: "than last week",
    bgGradient: "from-smartops-blue to-smartops-blue-hover"
  },
  {
    title: "Today's Users",
    value: "2,300",
    icon: Users,
    trend: "+3%",
    trendType: "up" as const,
    description: "than last month",
    bgGradient: "from-smartops-blue-hover to-smartops-blue"
  },
  {
    title: "Ads Views",
    value: "3,462",
    icon: Eye,
    trend: "-2%",
    trendType: "down" as const,
    description: "than yesterday",
    bgGradient: "from-smartops-gray to-smartops-dark"
  },
  {
    title: "Sales",
    value: "$103,430",
    icon: TrendingUp,
    trend: "+5%",
    trendType: "up" as const,
    description: "than yesterday",
    bgGradient: "from-smartops-blue to-smartops-blue-hover"
  }
]

// Mock data para los proyectos
const projects = [
  {
    name: "Material XD Version",
    company: "Adobe XD",
    members: [
      { name: "JM", color: "bg-purple-500" },
      { name: "AS", color: "bg-blue-500" },
      { name: "LK", color: "bg-green-500" },
      { name: "RP", color: "bg-orange-500" }
    ],
    budget: "$14,000",
    completion: 60
  },
  {
    name: "Add Progress Track",
    company: "Angular",
    members: [
      { name: "AD", color: "bg-red-500" },
      { name: "NG", color: "bg-red-600" }
    ],
    budget: "$3,000",
    completion: 10
  },
  {
    name: "Fix Platform Errors",
    company: "React",
    members: [
      { name: "RC", color: "bg-blue-500" },
      { name: "JS", color: "bg-yellow-500" }
    ],
    budget: "Not set",
    completion: 100
  },
  {
    name: "Launch our Mobile App",
    company: "Flutter",
    members: [
      { name: "FL", color: "bg-blue-400" },
      { name: "DR", color: "bg-blue-600" },
      { name: "MT", color: "bg-cyan-500" },
      { name: "AP", color: "bg-indigo-500" }
    ],
    budget: "$20,500",
    completion: 100
  },
  {
    name: "Add the New Pricing Page",
    company: "Next.js",
    members: [
      { name: "NX", color: "bg-gray-800" }
    ],
    budget: "$500",
    completion: 25
  },
  {
    name: "Redesign New Online Shop",
    company: "Shopify",
    members: [
      { name: "SH", color: "bg-green-600" },
      { name: "PY", color: "bg-green-500" }
    ],
    budget: "$2,000",
    completion: 40
  }
]

// Mock data para las órdenes
const orders = [
  {
    title: "$2400, Design changes",
    time: "22 DEC 7:20 PM",
    icon: Bell,
    iconBg: "bg-green-500"
  },
  {
    title: "New order #1832412",
    time: "21 DEC 11 PM",
    icon: Activity,
    iconBg: "bg-blue-500"
  },
  {
    title: "Server payments for April",
    time: "21 DEC 9:34 PM",
    icon: DollarSign,
    iconBg: "bg-orange-500"
  },
  {
    title: "New card added for order #4395133",
    time: "20 DEC 2:20 AM",
    icon: Activity,
    iconBg: "bg-purple-500"
  },
  {
    title: "Unlock packages for development",
    time: "18 DEC 4:54 AM",
    icon: Activity,
    iconBg: "bg-red-500"
  },
  {
    title: "New order #9583120",
    time: "17 DEC",
    icon: Activity,
    iconBg: "bg-gray-500"
  }
]

export default function Dashboard() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.token || !auth.user) {
      navigate("/signin");
    }
  }, [auth.token, auth.user, navigate]);

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 font-montserrat">{metric.title}</p>
                  <p className="text-3xl font-bold font-montserrat text-smartops-dark">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    {metric.trendType === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      metric.trendType === "up" ? "text-green-600" : "text-red-500"
                    } font-montserrat`}>
                      {metric.trend}
                    </span>
                    <span className="text-xs text-gray-500 ml-1 font-montserrat">{metric.description}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-gradient-to-br ${metric.bgGradient}`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Website Views */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 font-montserrat">
              <Eye className="w-6 h-6" />
              Website Views
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-montserrat mb-4">Last Campaign Performance</p>
            <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-lg mb-4 p-4">
              <WebsiteViewsChart />
            </div>
            <div className="flex items-center text-sm text-gray-500 font-montserrat">
              <Clock className="w-4 h-4 mr-2" />
              campaign sent 2 days ago
            </div>
          </CardContent>
        </Card>

        {/* Daily Sales */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 font-montserrat">
              <TrendingUp className="w-6 h-6" />
              Daily Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-green-600 font-montserrat mb-4">(+15%) increase in today sales.</p>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg mb-4 p-4">
              <DailySalesChart />
            </div>
            <div className="flex items-center text-sm text-gray-500 font-montserrat">
              <Clock className="w-4 h-4 mr-2" />
              updated 4 min ago
            </div>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 font-montserrat">
              <Activity className="w-6 h-6" />
              Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-montserrat mb-4">Last Campaign Performance</p>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg mb-4 p-4">
              <CompletedTasksChart />
            </div>
            <div className="flex items-center text-sm text-gray-500 font-montserrat">
              <Clock className="w-4 h-4 mr-2" />
              just updated
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table and Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Table */}
        <Card className="lg:col-span-2 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-3 font-montserrat">
                <Briefcase className="w-6 h-6" />
                Projects
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-montserrat mb-6">30 done this month</p>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-smartops-dark/60 border-b border-smartops-gray pb-2 font-montserrat">
                <div className="col-span-4">Companies</div>
                <div className="col-span-2">Members</div>
                <div className="col-span-3">Budget</div>
                <div className="col-span-3">Completion</div>
              </div>
              {projects.map((project) => (
                <div key={project.name} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-smartops-gray/30 last:border-b-0">
                  <div className="col-span-4">
                    <div>
                      <p className="font-medium text-smartops-dark font-montserrat">{project.name}</p>
                      <p className="text-sm text-smartops-dark/60 font-montserrat">{project.company}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex -space-x-2">
                      {project.members.map((member, memberIndex) => (
                        <Avatar key={`${project.name}-${member.name}-${memberIndex}`} className="w-6 h-6 border-2 border-smartops-white">
                          <AvatarFallback className={`text-xs text-smartops-white ${member.color}`}>{member.name}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <span className="font-medium text-smartops-dark font-montserrat">{project.budget}</span>
                  </div>
                  <div className="col-span-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-smartops-dark/60 font-montserrat">{project.completion}%</span>
                      </div>
                      <Progress value={project.completion} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orders Overview */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 font-montserrat">
              <Bell className="w-6 h-6" />
              Orders Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-4 h-4 text-orange-600 mr-2" />
              <span className="text-sm text-orange-600 font-medium font-montserrat">24% this month</span>
            </div>
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.title} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-lg ${order.iconBg} flex items-center justify-center`}>
                    <order.icon className="w-4 h-4 text-smartops-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-smartops-dark font-montserrat">{order.title}</p>
                    <p className="text-xs text-smartops-dark/60 font-montserrat">{order.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
