import type { ComponentType } from 'react';
import * as SimpleIcons from '@icons-pack/react-simple-icons';

type SimpleIcon = ComponentType<{
  className?: string;
  color?: string;
  size?: number | string;
  title?: string;
}>;

type TechStackIconDefinition = {
  Icon: SimpleIcon;
  color: string;
};

type TechStackIconProps = {
  label: string;
  className?: string;
  size?: number;
};

const icon = (Icon: SimpleIcon, color: string): TechStackIconDefinition => ({ Icon, color });

const TECH_STACK_ICON_MAP: Record<string, TechStackIconDefinition> = {
  adobeillustrator: icon(SimpleIcons.SiFigma, SimpleIcons.SiFigmaHex),
  adobephotoshop: icon(SimpleIcons.SiFigma, SimpleIcons.SiFigmaHex),
  android: icon(SimpleIcons.SiAndroid, SimpleIcons.SiAndroidHex),
  angular: icon(SimpleIcons.SiAngular, SimpleIcons.SiAngularHex),
  ansible: icon(SimpleIcons.SiLinux, SimpleIcons.SiLinuxHex),
  apachekafka: icon(SimpleIcons.SiApachekafka, SimpleIcons.SiApachekafkaHex),
  cloudflare: icon(SimpleIcons.SiCloudflare, SimpleIcons.SiCloudflareHex),
  css: icon(SimpleIcons.SiCss, SimpleIcons.SiCssHex),
  django: icon(SimpleIcons.SiDjango, SimpleIcons.SiDjangoHex),
  docker: icon(SimpleIcons.SiDocker, SimpleIcons.SiDockerHex),
  elasticsearch: icon(SimpleIcons.SiElasticsearch, SimpleIcons.SiElasticsearchHex),
  expo: icon(SimpleIcons.SiExpo, SimpleIcons.SiExpoHex),
  express: icon(SimpleIcons.SiExpress, SimpleIcons.SiExpressHex),
  expressjs: icon(SimpleIcons.SiExpress, SimpleIcons.SiExpressHex),
  figma: icon(SimpleIcons.SiFigma, SimpleIcons.SiFigmaHex),
  firebase: icon(SimpleIcons.SiFirebase, SimpleIcons.SiFirebaseHex),
  git: icon(SimpleIcons.SiGit, SimpleIcons.SiGitHex),
  github: icon(SimpleIcons.SiGithub, SimpleIcons.SiGithubHex),
  githubactions: icon(SimpleIcons.SiGithubactions, SimpleIcons.SiGithubactionsHex),
  gitlabci: icon(SimpleIcons.SiGitlab, SimpleIcons.SiGitlabHex),
  gitlabcicd: icon(SimpleIcons.SiGitlab, SimpleIcons.SiGitlabHex),
  googlecloud: icon(SimpleIcons.SiGooglecloud, SimpleIcons.SiGooglecloudHex),
  graphql: icon(SimpleIcons.SiGraphql, SimpleIcons.SiGraphqlHex),
  gradle: icon(SimpleIcons.SiGradle, SimpleIcons.SiGradleHex),
  grafana: icon(SimpleIcons.SiGrafana, SimpleIcons.SiGrafanaHex),
  hibernate: icon(SimpleIcons.SiHibernate, SimpleIcons.SiHibernateHex),
  html: icon(SimpleIcons.SiHtml5, SimpleIcons.SiHtml5Hex),
  htmlcss: icon(SimpleIcons.SiHtml5, SimpleIcons.SiHtml5Hex),
  java: icon(SimpleIcons.SiOpenjdk, SimpleIcons.SiOpenjdkHex),
  javascript: icon(SimpleIcons.SiJavascript, SimpleIcons.SiJavascriptHex),
  jenkins: icon(SimpleIcons.SiJenkins, SimpleIcons.SiJenkinsHex),
  jira: icon(SimpleIcons.SiJira, SimpleIcons.SiJiraHex),
  junit5: icon(SimpleIcons.SiJunit5, SimpleIcons.SiJunit5Hex),
  jwt: icon(SimpleIcons.SiJsonwebtokens, SimpleIcons.SiJsonwebtokensHex),
  kafka: icon(SimpleIcons.SiApachekafka, SimpleIcons.SiApachekafkaHex),
  kibana: icon(SimpleIcons.SiKibana, SimpleIcons.SiKibanaHex),
  kotlin: icon(SimpleIcons.SiKotlin, SimpleIcons.SiKotlinHex),
  kubernetes: icon(SimpleIcons.SiKubernetes, SimpleIcons.SiKubernetesHex),
  linux: icon(SimpleIcons.SiLinux, SimpleIcons.SiLinuxHex),
  logstash: icon(SimpleIcons.SiLogstash, SimpleIcons.SiLogstashHex),
  mariadb: icon(SimpleIcons.SiMariadb, SimpleIcons.SiMariadbHex),
  mongodb: icon(SimpleIcons.SiMongodb, SimpleIcons.SiMongodbHex),
  mysql: icon(SimpleIcons.SiMysql, SimpleIcons.SiMysqlHex),
  next: icon(SimpleIcons.SiNextdotjs, SimpleIcons.SiNextdotjsHex),
  nextjs: icon(SimpleIcons.SiNextdotjs, SimpleIcons.SiNextdotjsHex),
  nginx: icon(SimpleIcons.SiNginx, SimpleIcons.SiNginxHex),
  node: icon(SimpleIcons.SiNodedotjs, SimpleIcons.SiNodedotjsHex),
  nodejs: icon(SimpleIcons.SiNodedotjs, SimpleIcons.SiNodedotjsHex),
  notion: icon(SimpleIcons.SiNotion, SimpleIcons.SiNotionHex),
  openapi: icon(SimpleIcons.SiOpenapiinitiative, SimpleIcons.SiOpenapiinitiativeHex),
  openapiswagger: icon(SimpleIcons.SiSwagger, SimpleIcons.SiSwaggerHex),
  php: icon(SimpleIcons.SiPhp, SimpleIcons.SiPhpHex),
  postgresql: icon(SimpleIcons.SiPostgresql, SimpleIcons.SiPostgresqlHex),
  prometheus: icon(SimpleIcons.SiPrometheus, SimpleIcons.SiPrometheusHex),
  python: icon(SimpleIcons.SiPython, SimpleIcons.SiPythonHex),
  rabbitmq: icon(SimpleIcons.SiRabbitmq, SimpleIcons.SiRabbitmqHex),
  react: icon(SimpleIcons.SiReact, SimpleIcons.SiReactHex),
  reactjs: icon(SimpleIcons.SiReact, SimpleIcons.SiReactHex),
  reactnative: icon(SimpleIcons.SiReact, SimpleIcons.SiReactHex),
  redis: icon(SimpleIcons.SiRedis, SimpleIcons.SiRedisHex),
  redux: icon(SimpleIcons.SiRedux, SimpleIcons.SiReduxHex),
  rubyonrails: icon(SimpleIcons.SiRubyonrails, SimpleIcons.SiRubyonrailsHex),
  slack: icon(SimpleIcons.SiSocketdotio, SimpleIcons.SiSocketdotioHex),
  socketio: icon(SimpleIcons.SiSocketdotio, SimpleIcons.SiSocketdotioHex),
  spring: icon(SimpleIcons.SiSpring, SimpleIcons.SiSpringHex),
  springboot: icon(SimpleIcons.SiSpringboot, SimpleIcons.SiSpringbootHex),
  springwebflux: icon(SimpleIcons.SiSpring, SimpleIcons.SiSpringHex),
  sqlite: icon(SimpleIcons.SiSqlite, SimpleIcons.SiSqliteHex),
  supabase: icon(SimpleIcons.SiSupabase, SimpleIcons.SiSupabaseHex),
  swagger: icon(SimpleIcons.SiSwagger, SimpleIcons.SiSwaggerHex),
  swift: icon(SimpleIcons.SiSwift, SimpleIcons.SiSwiftHex),
  tailwind: icon(SimpleIcons.SiTailwindcss, SimpleIcons.SiTailwindcssHex),
  tailwindcss: icon(SimpleIcons.SiTailwindcss, SimpleIcons.SiTailwindcssHex),
  terraform: icon(SimpleIcons.SiTerraform, SimpleIcons.SiTerraformHex),
  typescript: icon(SimpleIcons.SiTypescript, SimpleIcons.SiTypescriptHex),
  vercel: icon(SimpleIcons.SiVercel, SimpleIcons.SiVercelHex),
  vue: icon(SimpleIcons.SiVuedotjs, SimpleIcons.SiVuedotjsHex),
  vuejs: icon(SimpleIcons.SiVuedotjs, SimpleIcons.SiVuedotjsHex),
  webflux: icon(SimpleIcons.SiSpring, SimpleIcons.SiSpringHex),
  websocket: icon(SimpleIcons.SiSocketdotio, SimpleIcons.SiSocketdotioHex),
};

export default function TechStackIcon({ label, className = '', size = 14 }: TechStackIconProps) {
  const definition = TECH_STACK_ICON_MAP[normalizeTechStackName(label)];

  if (!definition) {
    return null;
  }

  const { Icon, color } = definition;

  return (
    <Icon aria-hidden className={`shrink-0 ${className}`} color={color} size={size} title={label} />
  );
}

function normalizeTechStackName(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\+/g, 'plus')
    .replace(/#/g, 'sharp')
    .replace(/[^a-z0-9]/g, '');
}
