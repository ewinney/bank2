import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function FAQSection({ className }) {
  return (
    <div className={className}>
      <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>What file types are supported?</AccordionTrigger>
          <AccordionContent>
            We currently support PDF, JPG, JPEG, and PNG file formats for bank statements.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>How is my data protected?</AccordionTrigger>
          <AccordionContent>
            Your data is encrypted in transit and at rest. We do not store your bank statements after analysis.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>How accurate is the analysis?</AccordionTrigger>
          <AccordionContent>
            Our AI-powered analysis is highly accurate, but we recommend reviewing the results and consulting with a financial professional for important decisions.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}