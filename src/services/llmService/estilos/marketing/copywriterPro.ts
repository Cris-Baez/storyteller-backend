import { callOpenRouter } from '../../openRouterUtil.js';

export interface VideoScript {
  hook: {
    text: string;
    duration: number;
    visual: string;
    emotion: string;
  };
  problem: {
    text: string;
    duration: number;
    visual: string;
    painPoints: string[];
  };
  solution: {
    text: string;
    duration: number;
    visual: string;
    benefits: string[];
  };
  proof: {
    text: string;
    duration: number;
    visual: string;
    credibility: string[];
  };
  callToAction: {
    text: string;
    duration: number;
    visual: string;
    urgency: string;
  };
  totalDuration: number;
  style: string;
  tone: string;
  targetEmotion: string;
}

export interface CopyVariations {
  headlines: string[];
  subheadings: string[];
  callToActions: string[];
  descriptions: string[];
  hooks: string[];
  socialPosts: {
    instagram: string[];
    facebook: string[];
    linkedin: string[];
    twitter: string[];
  };
  emailSubjects: string[];
  adCopy: {
    short: string[];
    medium: string[];
    long: string[];
  };
}

export async function generateVideoScript(
  businessAnalysis: any, 
  contentStrategy: any, 
  creativeDirection: any
): Promise<VideoScript> {
  const prompt = `
    You are a world-class Copywriter specializing in high-converting video scripts.
    
    Create a compelling video script based on this information:
    
    BUSINESS: ${JSON.stringify(businessAnalysis, null, 2)}
    STRATEGY: ${JSON.stringify(contentStrategy, null, 2)}
    CREATIVE: ${JSON.stringify(creativeDirection, null, 2)}
    
    Create a video script following the HPSCA framework:
    1. HOOK: Attention-grabbing opening (3-5 seconds)
    2. PROBLEM: Identify the pain point (5-8 seconds)
    3. SOLUTION: Present your solution (8-12 seconds)
    4. PROOF: Social proof/credibility (5-8 seconds)
    5. CALL TO ACTION: Clear next step (3-5 seconds)
    
    Requirements:
    - Total duration: 30 seconds maximum
    - Each section needs specific visual description
    - Emotional triggers for target audience
    - Conversion-optimized language
    - Brand voice consistency
    
    Return as valid JSON matching the VideoScript interface.
  `;

  try {
    const response = await callOpenRouter(
      'You are a world-class Copywriter specializing in high-converting video scripts and marketing copy.',
      prompt,
      'anthropic/claude-3.5-sonnet'
    );

    const script = JSON.parse(response);
    
    // Validate and ensure all required fields
    return {
      hook: {
        text: script.hook?.text || 'Attention business owners!',
        duration: script.hook?.duration || 4,
        visual: script.hook?.visual || 'Dynamic opening scene',
        emotion: script.hook?.emotion || 'curiosity'
      },
      problem: {
        text: script.problem?.text || 'Struggling with growth challenges?',
        duration: script.problem?.duration || 6,
        visual: script.problem?.visual || 'Problem visualization',
        painPoints: script.problem?.painPoints || ['Limited growth', 'Competition', 'Resources']
      },
      solution: {
        text: script.solution?.text || 'We have the perfect solution for you.',
        duration: script.solution?.duration || 10,
        visual: script.solution?.visual || 'Solution demonstration',
        benefits: script.solution?.benefits || ['Fast results', 'Expert guidance', 'Proven system']
      },
      proof: {
        text: script.proof?.text || 'Join hundreds of satisfied clients.',
        duration: script.proof?.duration || 6,
        visual: script.proof?.visual || 'Success testimonials',
        credibility: script.proof?.credibility || ['Client testimonials', 'Results data', 'Expert team']
      },
      callToAction: {
        text: script.callToAction?.text || 'Get started today!',
        duration: script.callToAction?.duration || 4,
        visual: script.callToAction?.visual || 'Strong CTA visual',
        urgency: script.callToAction?.urgency || 'limited time offer'
      },
      totalDuration: 30,
      style: creativeDirection?.execution?.videoStyle || 'professional showcase',
      tone: creativeDirection?.brandPersonality?.tone || 'confident and approachable',
      targetEmotion: creativeDirection?.moodBoard?.energy || 'energetic'
    };
  } catch (error) {
    console.error('Video Script Generation Error:', error);
    
    // Fallback script based on business type
    const businessType = businessAnalysis?.businessType || 'service';
    const isB2B = businessAnalysis?.targetAudience?.segment === 'businesses';
    
    return {
      hook: {
        text: isB2B ? 'Ready to transform your business?' : 'Discover the solution you\'ve been waiting for!',
        duration: 4,
        visual: 'Dynamic business scene',
        emotion: 'curiosity'
      },
      problem: {
        text: isB2B ? 'Tired of slow growth and competitive pressure?' : 'Frustrated with current results?',
        duration: 6,
        visual: 'Problem visualization',
        painPoints: isB2B ? ['Slow growth', 'Competition', 'Efficiency'] : ['Limited results', 'Time waste', 'Frustration']
      },
      solution: {
        text: 'Our proven system delivers the results you need.',
        duration: 10,
        visual: 'Solution showcase',
        benefits: ['Proven results', 'Expert support', 'Fast implementation']
      },
      proof: {
        text: 'Join thousands of successful clients worldwide.',
        duration: 6,
        visual: 'Success stories',
        credibility: ['Client success', 'Proven track record', 'Expert team']
      },
      callToAction: {
        text: 'Start your transformation today!',
        duration: 4,
        visual: 'Strong call to action',
        urgency: 'limited time offer'
      },
      totalDuration: 30,
      style: 'professional showcase',
      tone: 'confident and results-focused',
      targetEmotion: 'motivated'
    };
  }
}

export async function generateCopyVariations(
  businessAnalysis: any, 
  contentStrategy: any, 
  creativeDirection: any
): Promise<CopyVariations> {
  const prompt = `
    You are a world-class Copywriter creating multiple variations of marketing copy.
    
    Based on this information:
    
    BUSINESS: ${JSON.stringify(businessAnalysis, null, 2)}
    STRATEGY: ${JSON.stringify(contentStrategy, null, 2)}
    CREATIVE: ${JSON.stringify(creativeDirection, null, 2)}
    
    Generate multiple variations for each copy element:
    
    1. HEADLINES: 5 powerful headlines for main campaigns
    2. SUBHEADINGS: 5 supporting subheadings
    3. CALL TO ACTIONS: 5 different CTAs with varying urgency
    4. DESCRIPTIONS: 5 product/service descriptions (different lengths)
    5. HOOKS: 5 attention-grabbing hooks for videos/ads
    6. SOCIAL POSTS: 3 variations each for Instagram, Facebook, LinkedIn, Twitter
    7. EMAIL SUBJECTS: 5 compelling email subject lines
    8. AD COPY: Short (25 words), Medium (50 words), Long (100 words) - 3 of each
    
    Focus on:
    - Conversion optimization
    - Emotional triggers
    - Target audience resonance
    - Brand voice consistency
    - A/B testing variations
    
    Return as valid JSON matching the CopyVariations interface.
  `;

  try {
    const response = await callOpenRouter(
      'You are a world-class Copywriter specializing in high-converting marketing copy and A/B testing variations.',
      prompt,
      'anthropic/claude-3.5-sonnet'
    );

    const variations = JSON.parse(response);
    
    // Validate and provide fallbacks
    const businessName = businessAnalysis?.businessName || 'Your Business';
    const isB2B = businessAnalysis?.targetAudience?.segment === 'businesses';
    
    return {
      headlines: variations.headlines || [
        `Transform Your ${isB2B ? 'Business' : 'Life'} with ${businessName}`,
        `The Ultimate Solution for ${isB2B ? 'Growth-Focused Companies' : 'Success Seekers'}`,
        `Why ${businessName} is Different`,
        `Get Results Fast with Our Proven System`,
        `${businessName}: Your Partner in Success`
      ],
      subheadings: variations.subheadings || [
        'Proven results in record time',
        'Join thousands of satisfied clients',
        'Expert guidance every step of the way',
        'No risk, all reward guarantee',
        'Transform your future today'
      ],
      callToActions: variations.callToActions || [
        'Get Started Now',
        'Claim Your Free Consultation',
        'Transform Today',
        'Join Now - Limited Time',
        'Start Your Journey'
      ],
      descriptions: variations.descriptions || [
        'Professional excellence delivered.',
        'Comprehensive solutions for modern challenges and growth.',
        'Expert-designed services that deliver measurable results for ambitious individuals and businesses.',
        'Transform your approach with our proven methodology, expert guidance, and personalized support system designed for success.',
        'The complete solution combining cutting-edge techniques, personalized strategies, expert mentorship, and proven systems to deliver exceptional results that exceed expectations and drive sustainable growth.'
      ],
      hooks: variations.hooks || [
        'Ready to transform everything?',
        'What if success was guaranteed?',
        'The secret they don\'t want you to know',
        'This changes everything you thought you knew',
        'The breakthrough you\'ve been waiting for'
      ],
      socialPosts: {
        instagram: variations.socialPosts?.instagram || [
          '🚀 Ready for transformation? See what\'s possible! #Success',
          '💡 Game-changing results start here. Link in bio!',
          '✨ Your breakthrough moment awaits. Don\'t miss out!'
        ],
        facebook: variations.socialPosts?.facebook || [
          'Discover why thousands choose us for their transformation journey.',
          'Ready to see real results? Our proven system delivers every time.',
          'Join the success stories. Your journey starts here.'
        ],
        linkedin: variations.socialPosts?.linkedin || [
          'Professional growth requires the right partner. Here\'s why industry leaders choose us.',
          'Transform your business strategy with proven methodologies and expert guidance.',
          'Elevate your success with data-driven solutions and personalized support.'
        ],
        twitter: variations.socialPosts?.twitter || [
          '🎯 Success isn\'t luck. It\'s strategy. Get yours here.',
          '⚡ Transform faster with the right system.',
          '🔥 Ready for breakthrough results? Let\'s go!'
        ]
      },
      emailSubjects: variations.emailSubjects || [
        'Your transformation starts here',
        'Exclusive: The success system everyone\'s talking about',
        'Ready to see real results?',
        '[Limited Time] Your breakthrough opportunity',
        'This could change everything for you'
      ],
      adCopy: {
        short: variations.adCopy?.short || [
          'Transform your results with our proven system.',
          'Expert guidance. Real results. Start today.',
          'Join thousands of success stories worldwide.'
        ],
        medium: variations.adCopy?.medium || [
          'Ready for transformation? Our proven system delivers real results for ambitious individuals and businesses. Expert guidance, personalized support, and measurable outcomes. Start your journey today.',
          'Discover the difference expert guidance makes. Our comprehensive approach combines proven strategies with personalized support to deliver exceptional results. Join thousands of satisfied clients.',
          'Transform your approach with our proven methodology. Get expert guidance, personalized strategies, and measurable results that exceed expectations. Your success story starts here.'
        ],
        long: variations.adCopy?.long || [
          'Transform your entire approach with our comprehensive system designed for ambitious individuals and businesses. Our proven methodology combines cutting-edge strategies, personalized guidance, and expert support to deliver measurable results that exceed expectations. Join thousands of successful clients who have transformed their lives and businesses with our proven system. Expert mentorship, personalized strategies, and guaranteed results await. Your breakthrough moment is here. Start your transformation journey today and discover what true success feels like.',
          'Discover the complete solution that industry leaders trust for transformation and growth. Our expert-designed system combines proven strategies, personalized mentorship, and cutting-edge techniques to deliver exceptional results every time. Whether you\'re looking to transform your business or elevate your personal success, our comprehensive approach ensures you get the guidance, support, and results you deserve. Join our community of successful clients and experience the difference that true expertise makes. Your success story starts with a single decision.',
          'Ready to transform everything you thought you knew about success? Our proven system has helped thousands of ambitious individuals and businesses achieve breakthrough results through our comprehensive approach combining expert guidance, personalized strategies, and cutting-edge methodologies. Get access to the same proven system that industry leaders use to achieve exceptional results. With personalized support, expert mentorship, and guaranteed outcomes, your transformation journey begins here. Don\'t settle for ordinary when extraordinary results are within reach.'
        ]
      }
    };
  } catch (error) {
    console.error('Copy Variations Generation Error:', error);
    
    // Return comprehensive fallback
    const businessName = businessAnalysis?.businessName || 'Your Business';
    
    return {
      headlines: [`Transform with ${businessName}`, 'Proven Results System', 'Expert Solutions', 'Success Guaranteed', 'Join the Leaders'],
      subheadings: ['Expert guidance', 'Proven results', 'Satisfied clients', 'Risk-free guarantee', 'Transform today'],
      callToActions: ['Get Started', 'Free Consultation', 'Transform Now', 'Join Today', 'Start Journey'],
      descriptions: ['Professional excellence', 'Comprehensive solutions for growth', 'Expert services with measurable results', 'Complete transformation system', 'Ultimate success solution'],
      hooks: ['Ready to transform?', 'Success guaranteed?', 'The secret revealed', 'This changes everything', 'Your breakthrough awaits'],
      socialPosts: {
        instagram: ['🚀 Transform now! #Success', '💡 Game changer here!', '✨ Breakthrough awaits!'],
        facebook: ['Discover transformation', 'Ready for results?', 'Join success stories'],
        linkedin: ['Professional growth partner', 'Transform business strategy', 'Elevate your success'],
        twitter: ['🎯 Success strategy here', '⚡ Transform faster', '🔥 Breakthrough results']
      },
      emailSubjects: ['Transform starts here', 'Success system revealed', 'Ready for results?', 'Breakthrough opportunity', 'Change everything'],
      adCopy: {
        short: ['Transform with proven system', 'Expert guidance, real results', 'Join success stories worldwide'],
        medium: ['Ready for transformation? Proven system delivers real results. Expert guidance and personalized support. Start today.'],
        long: ['Transform your approach with our comprehensive proven system. Expert guidance, personalized strategies, measurable results. Join thousands of successful clients worldwide.']
      }
    };
  }
}

// FASE 2: PLATFORM-SPECIFIC COPY GENERATION
export interface PlatformCopy {
  instagram: {
    caption: string;        // Engaging with emojis
    hashtags: string[];     // Optimized for reach  
    cta: string;           // Irresistible call to action
    overlayTexts: string[]; // Texts appearing in video
  };
  linkedin: {
    headline: string;       // Professional, lead-generating
    description: string;    // Clear business value
    industryHashtags: string[];
    businessCta: string;
  };
  tiktok: {
    hook: string;          // Crucial first 3 seconds  
    narrative: string[];    // Story that maintains attention
    trendingHashtags: string[];
    viralElements: string[];
  };
  facebook: {
    headline: string;
    description: string;
    cta: string;
    targetingKeywords: string[];
  };
  twitter: {
    tweet: string;
    thread: string[];
    hashtags: string[];
    engagement: string;
  };
}

export interface PsychologicalHooks {
  opening: {
    curiosity: string[];   // "Did you know that 90% of..."
    problem: string[];     // "If you're like me, you hate..."  
    benefit: string[];     // "In just 5 minutes you can..."
    socialProof: string[]; // "Over 500 companies already..."
  };
  maintenance: {
    tension: string[];      // Maintain attention mid-video
    revelation: string[];   // "Aha" moments
    story: string[];        // Narrative elements
  };
  closing: {
    urgency: string[];     // "Only for this week..."
    ease: string[];        // "It's easier than ordering an Uber"
    authority: string[];   // "With 10 years of experience..."
  };
}

export async function generatePlatformSpecificCopy(
  businessAnalysis: any,
  contentStrategy: any,
  targetPlatforms: string[]
): Promise<PlatformCopy> {
  const prompt = `
    You are a Platform-Specific Copywriter Expert who creates high-converting copy for different social media platforms.
    
    BUSINESS CONTEXT:
    ${JSON.stringify(businessAnalysis, null, 2)}
    
    CONTENT STRATEGY:
    ${JSON.stringify(contentStrategy, null, 2)}
    
    TARGET PLATFORMS: ${targetPlatforms.join(', ')}
    
    Create platform-optimized copy for each platform:
    
    INSTAGRAM:
    - Caption: Engaging, emoji-rich, storytelling approach
    - Hashtags: Mix of trending and niche tags (20-30 tags)
    - CTA: Natural, non-pushy but action-driving
    - Overlay texts: Short impactful phrases for video

    LINKEDIN:
    - Headline: Professional, B2B focused, lead-generating
    - Description: Value-driven, industry insights, thought leadership
    - Hashtags: Professional industry tags (5-10)
    - CTA: Professional networking/business focused

    TIKTOK:
    - Hook: First 3 seconds that stop the scroll
    - Narrative: Story elements that maintain attention
    - Hashtags: Trending + niche mix (10-15)
    - Viral elements: Trends, challenges, relatable content

    FACEBOOK:
    - Headline: Community-focused, discussion-starting
    - Description: Detailed value proposition
    - CTA: Community engagement focused
    - Keywords: For targeting optimization

    TWITTER:
    - Tweet: Concise, quotable, retweet-worthy
    - Thread: Multi-part story/explanation
    - Hashtags: Trending + relevant (2-5)
    - Engagement: Question or poll format

    Focus on:
    - Platform-specific best practices
    - Audience behavior per platform
    - Conversion optimization for each platform
    - Brand voice consistency across platforms
    
    Return as valid JSON matching the PlatformCopy interface.
  `;

  try {
    const response = await callOpenRouter(
      'You are a Platform-Specific Copywriter Expert specializing in high-converting copy for different social media platforms.',
      prompt,
      'anthropic/claude-3.5-sonnet'
    );

    const platformCopy = JSON.parse(response);
    const businessName = businessAnalysis?.businessName || 'Your Business';
    const businessType = businessAnalysis?.businessType || 'service';
    
    // Validate and provide platform-optimized fallbacks
    return {
      instagram: {
        caption: platformCopy.instagram?.caption || `✨ Ready to transform your ${businessType}? Here's what ${businessName} can do for you! 🚀\n\nWe believe every business deserves to thrive. That's why we've helped hundreds of clients achieve their goals. 💪\n\nWhat's your biggest challenge right now? Tell us below! 👇`,
        hashtags: platformCopy.instagram?.hashtags || [
          `#${businessType}`, '#business', '#success', '#transformation', '#growth', 
          '#entrepreneur', '#motivation', '#results', '#professional', '#expert',
          '#clientsuccess', '#businessowner', '#leadership', '#innovation', '#strategy'
        ],
        cta: platformCopy.instagram?.cta || 'DM us to get started! 💬',
        overlayTexts: platformCopy.instagram?.overlayTexts || [
          'Transform Your Business', 'Proven Results', 'Expert Guidance', 'Start Today'
        ]
      },
      linkedin: {
        headline: platformCopy.linkedin?.headline || `How ${businessName} is Transforming the ${businessType.charAt(0).toUpperCase() + businessType.slice(1)} Industry`,
        description: platformCopy.linkedin?.description || `In today's competitive landscape, businesses need more than just good intentions—they need proven strategies and expert execution.\n\nAt ${businessName}, we've developed a comprehensive approach that delivers measurable results for our clients. Here's what makes us different:\n\n• Proven methodology with track record of success\n• Personalized strategies tailored to your specific needs\n• Expert team with years of industry experience\n• Measurable outcomes that drive real growth\n\nReady to elevate your business to the next level?\n\nWhat's your biggest business challenge right now?`,
        industryHashtags: platformCopy.linkedin?.industryHashtags || [
          '#BusinessStrategy', '#ProfessionalServices', '#Leadership', '#Growth', '#Innovation'
        ],
        businessCta: platformCopy.linkedin?.businessCta || 'Send me a message to discuss how we can help your business grow.'
      },
      tiktok: {
        hook: platformCopy.tiktok?.hook || `POV: You finally found the ${businessType} that actually delivers results 👀`,
        narrative: platformCopy.tiktok?.narrative || [
          'You know that feeling when nothing seems to work?',
          'We\'ve all been there - trying everything with no results',
          'But what if I told you there\'s a better way?',
          'Here\'s what changed everything for our clients'
        ],
        trendingHashtags: platformCopy.tiktok?.trendingHashtags || [
          '#BusinessTips', '#Success', '#Transformation', '#Results', '#Expert', '#Professional'
        ],
        viralElements: platformCopy.tiktok?.viralElements || [
          'Before vs After results', 'Common mistakes everyone makes', 'Insider secrets revealed'
        ]
      },
      facebook: {
        headline: platformCopy.facebook?.headline || `This ${businessName} Discovery Changed Everything for Local Businesses`,
        description: platformCopy.facebook?.description || `Are you tired of trying different approaches without seeing real results?\n\nYou're not alone. Most business owners struggle with the same challenges:\n❌ Limited growth despite hard work\n❌ Competitive pressure\n❌ Lack of expert guidance\n\nThat's exactly why we created our proven system. Over the past years, we've helped hundreds of businesses transform their approach and achieve the results they deserve.\n\n✅ Proven strategies that work\n✅ Expert guidance every step\n✅ Measurable results\n✅ Personalized approach\n\nReady to see what's possible for your business?`,
        cta: platformCopy.facebook?.cta || 'Comment "READY" and we\'ll send you more information!',
        targetingKeywords: platformCopy.facebook?.targetingKeywords || [
          'business growth', 'professional services', 'expert guidance', 'proven results'
        ]
      },
      twitter: {
        tweet: platformCopy.twitter?.tweet || `🧵 The #1 mistake most ${businessType} businesses make (and how to fix it):`,
        thread: platformCopy.twitter?.thread || [
          `1/ Most businesses focus on tactics without strategy`,
          `2/ They try to do everything themselves instead of getting expert help`,
          `3/ They don't measure results properly`,
          `4/ Here's what successful businesses do differently...`,
          `5/ They invest in proven systems and expert guidance`,
          `Ready to transform your approach? Let's connect 🚀`
        ],
        hashtags: platformCopy.twitter?.hashtags || ['#BusinessTips', '#Success', '#Growth'],
        engagement: platformCopy.twitter?.engagement || 'What\'s been your biggest business challenge this year? 🤔'
      }
    };
  } catch (error) {
    console.error('Platform Copy Generation Error:', error);
    
    // Return comprehensive fallbacks
    const businessName = businessAnalysis?.businessName || 'Your Business';
    const businessType = businessAnalysis?.businessType || 'service';
    
    return {
      instagram: {
        caption: `✨ Transform your ${businessType} with ${businessName}! 🚀`,
        hashtags: [`#${businessType}`, '#business', '#success', '#growth', '#expert'],
        cta: 'DM us to get started!',
        overlayTexts: ['Transform Now', 'Expert Results', 'Proven System', 'Start Today']
      },
      linkedin: {
        headline: `Professional ${businessType} Solutions`,
        description: 'Expert guidance for business transformation and growth.',
        industryHashtags: ['#BusinessStrategy', '#ProfessionalServices', '#Growth'],
        businessCta: 'Connect with us for expert guidance.'
      },
      tiktok: {
        hook: 'This changed everything for my business',
        narrative: ['Common problem', 'Solution revealed', 'Results achieved'],
        trendingHashtags: ['#BusinessTips', '#Success', '#Transformation'],
        viralElements: ['Before/after', 'Mistakes revealed', 'Secrets shared']
      },
      facebook: {
        headline: 'Transform Your Business Results',
        description: 'Proven system for business growth and success.',
        cta: 'Learn more today!',
        targetingKeywords: ['business growth', 'expert guidance', 'proven results']
      },
      twitter: {
        tweet: 'Business transformation starts here 🚀',
        thread: ['Problem identified', 'Solution explained', 'Results delivered'],
        hashtags: ['#Business', '#Success', '#Growth'],
        engagement: 'What\'s your biggest challenge?'
      }
    };
  }
}

export async function generatePsychologicalHooks(
  businessAnalysis: any,
  targetAudience: string,
  conversionGoal: string
): Promise<PsychologicalHooks> {
  const prompt = `
    You are a Psychological Marketing Expert specializing in persuasive hooks and triggers.
    
    BUSINESS CONTEXT:
    ${JSON.stringify(businessAnalysis, null, 2)}
    
    TARGET AUDIENCE: ${targetAudience}
    CONVERSION GOAL: ${conversionGoal}
    
    Create psychological hooks organized by video/content section:
    
    OPENING HOOKS:
    - Curiosity: Statistics, surprising facts, "Did you know..."
    - Problem: Pain point identification, "If you're like me..."
    - Benefit: Immediate value proposition, "In just X minutes..."
    - Social Proof: Authority/popularity, "Over X people already..."
    
    MAINTENANCE HOOKS:
    - Tension: Keep attention, create suspense, "But here's the problem..."
    - Revelation: "Aha" moments, insights, "Here's what I discovered..."
    - Story: Narrative elements, relatability, "Let me tell you about..."
    
    CLOSING HOOKS:
    - Urgency: Time-sensitive offers, "Only until..."
    - Ease: Simplicity emphasis, "It's as easy as..."
    - Authority: Credibility reinforcement, "With X years of experience..."
    
    Requirements:
    - Each category needs 5-7 different hooks
    - Tailored to the specific business and audience
    - Conversion-optimized language
    - Natural, not overly salesy
    - Psychological principles applied (scarcity, social proof, authority, etc.)
    
    Return as valid JSON matching the PsychologicalHooks interface.
  `;

  try {
    const response = await callOpenRouter(
      'You are a Psychological Marketing Expert specializing in persuasive hooks and psychological triggers.',
      prompt,
      'anthropic/claude-3.5-sonnet'
    );

    const hooks = JSON.parse(response);
    const businessType = businessAnalysis?.businessType || 'service';
    const businessName = businessAnalysis?.businessName || 'our service';
    
    return {
      opening: {
        curiosity: hooks.opening?.curiosity || [
          `Did you know that 90% of ${businessType} businesses fail at this one thing?`,
          `Here's the surprising truth about successful ${businessType} companies`,
          `What if I told you there's a hidden factor that determines success?`,
          `The secret that top performers don't want you to know`,
          `This shocking statistic will change how you think about ${businessType}`
        ],
        problem: hooks.opening?.problem || [
          `If you're like most business owners, you're probably frustrated with slow growth`,
          `Tired of trying everything but seeing no real results?`,
          `Are you struggling with the same challenges as everyone else?`,
          `Sick of watching competitors succeed while you're stuck?`,
          `If you're working harder but not seeing progress, this is for you`
        ],
        benefit: hooks.opening?.benefit || [
          `In just 30 days, you could transform your entire business approach`,
          `Imagine achieving in weeks what takes others years`,
          `What if you could get expert results without the expert price?`,
          `In the next 5 minutes, you'll discover the solution you've been seeking`,
          `Get the same results as industry leaders in half the time`
        ],
        socialProof: hooks.opening?.socialProof || [
          `Over 500 businesses have already transformed with our system`,
          `Join the thousands who've already discovered this solution`,
          `What 95% of successful ${businessType} companies know (and you should too)`,
          `The approach that industry leaders swear by`,
          `Trusted by professionals in over 30 countries worldwide`
        ]
      },
      maintenance: {
        tension: hooks.maintenance?.tension || [
          `But here's the problem most people don't realize...`,
          `The mistake that's costing you thousands every month`,
          `What nobody tells you about the ${businessType} industry`,
          `The hidden obstacle that stops 90% of people`,
          `But there's a catch that changes everything`
        ],
        revelation: hooks.maintenance?.revelation || [
          `Here's what I discovered that changed everything`,
          `The breakthrough moment that made all the difference`,
          `This insight transformed how we approach ${businessType}`,
          `The "aha" moment that our most successful clients experience`,
          `What we learned from analyzing thousands of success stories`
        ],
        story: hooks.maintenance?.story || [
          `Let me tell you about a client who was exactly where you are now`,
          `I remember when I first discovered this approach`,
          `Here's what happened when we implemented this system`,
          `Last month, a business owner told me something that changed my perspective`,
          `The story that proves this approach works for anyone`
        ]
      },
      closing: {
        urgency: hooks.closing?.urgency || [
          `This exclusive offer ends at midnight tonight`,
          `Only 50 spots available for our next program`,
          `The price increases next week - secure yours now`,
          `Limited time: Get started before the deadline`,
          `Join now before we reach capacity`
        ],
        ease: hooks.closing?.ease || [
          `It's easier than ordering takeout online`,
          `Simpler than sending an email`,
          `Takes less effort than your morning coffee routine`,
          `No complicated setups or technical skills required`,
          `Get started in under 5 minutes`
        ],
        authority: hooks.closing?.authority || [
          `With over 10 years of proven results in ${businessType}`,
          `Backed by industry-leading experts and specialists`,
          `Developed by the team that transformed thousands of businesses`,
          `Created by recognized authorities in the field`,
          `Endorsed by top professionals and industry leaders`
        ]
      }
    };
  } catch (error) {
    console.error('Psychological Hooks Generation Error:', error);
    
    // Return fallback hooks
    return {
      opening: {
        curiosity: ['Did you know this surprising business fact?', 'The secret successful companies use', 'What experts don\'t tell you'],
        problem: ['Frustrated with slow growth?', 'Tired of trying everything?', 'Struggling with challenges?'],
        benefit: ['Transform in 30 days', 'Get expert results', 'Achieve success faster'],
        socialProof: ['500+ businesses transformed', 'Thousands already discovered', 'Trusted by professionals']
      },
      maintenance: {
        tension: ['But here\'s the problem...', 'The hidden obstacle', 'What nobody tells you'],
        revelation: ['Here\'s what changed everything', 'The breakthrough moment', 'This insight transformed us'],
        story: ['Let me tell you about a client', 'I remember when I discovered', 'Here\'s what happened']
      },
      closing: {
        urgency: ['Offer ends tonight', 'Limited spots available', 'Price increases soon'],
        ease: ['Easier than ordering online', 'Simpler than email', 'No technical skills needed'],
        authority: ['10+ years proven results', 'Industry-leading experts', 'Recognized authorities']
      }
    };
  }
}

export async function optimizeCopyForConversion(
  copy: string, 
  businessAnalysis: any, 
  conversionGoal: string
): Promise<string> {
  const prompt = `
    You are a Conversion Optimization Expert specializing in high-converting copy.
    
    CURRENT COPY: "${copy}"
    BUSINESS: ${JSON.stringify(businessAnalysis, null, 2)}
    CONVERSION GOAL: ${conversionGoal}
    
    Optimize this copy for maximum conversion by:
    1. Adding psychological triggers
    2. Improving clarity and urgency
    3. Enhancing emotional appeal
    4. Strengthening the value proposition
    5. Optimizing for the specific conversion goal
    
    Return only the optimized copy, no explanations.
  `;

  try {
    const optimizedCopy = await callOpenRouter(
      'You are a Conversion Optimization Expert specializing in high-converting marketing copy.',
      prompt,
      'anthropic/claude-3.5-sonnet'
    );

    return optimizedCopy.trim();
  } catch (error) {
    console.error('Copy Optimization Error:', error);
    return copy; // Return original if optimization fails
  }
}
