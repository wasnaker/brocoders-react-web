import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "privacy-policy");

  return {
    title: t("title"),
  };
}

async function PrivacyPolicy(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "privacy-policy");

  return (
    <div className="page-content--document">
      <h1 data-testid="privacy-policy-title" className="doc-title">
        {t("title")}
      </h1>
      <p className="doc-p">{t("lastUpdated")}</p>
      <p data-testid="privacy-policy-description" className="doc-p">
        {t("description1")}
      </p>
      <p className="doc-p">{t("description2")}</p>

      <h2 className="doc-heading-2">{t("interpretation_and_definitions")}</h2>
      <h3 className="doc-heading-3">{t("interpretation")}</h3>
      <p className="doc-p">{t("interpretation_description")}</p>
      <h3 className="doc-heading-3">{t("definitions")}</h3>
      <p className="doc-p">{t("definitions_description")}</p>
      <ul className="doc-list">
        <li>
          <strong>{t("account_title")}</strong>
          {t("account_description")}
        </li>
        <li>
          <strong>{t("affiliate_title")}</strong>
          {t("affiliate_description")}
        </li>
        <li>
          <strong>{t("company_title")}</strong>
          {t("company_description")}
        </li>
        <li>
          <strong>{t("cookies_title")}</strong>
          {t("cookies_definition")}
        </li>
        <li>
          <strong>{t("device_title")}</strong>
          {t("device_description")}
        </li>
        <li>
          <strong>{t("personal_data_title")}</strong>
          {t("personal_data_definition")}
        </li>
        <li>
          <strong>{t("service_title")}</strong>
          {t("service_description")}
        </li>
        <li>
          <strong>{t("service_provider_title")}</strong>
          {t("service_provider_description")}
        </li>
        <li>
          <strong>{t("usage_data_title")}</strong>
          {t("usage_data_description")}
        </li>
        <li>
          <strong>{t("website_title")}</strong>
          {t("website_description")}
          <a
            target="_blank"
            rel="external noopener noreferrer"
            className="doc-link"
            href="https://react-boilerplate-coral.vercel.app/"
          >
            https://react-boilerplate-coral.vercel.app
          </a>
        </li>
        <li>
          <strong>{t("you_title")}</strong>
          {t("you_description")}
        </li>
      </ul>

      <h2 className="doc-heading-2">
        {t("collecting_and_using_personal_data")}
      </h2>
      <h3 className="doc-heading-3">{t("types_of_data_collected")}</h3>
      <h4 className="doc-heading-4">{t("personal_data")}</h4>
      <p className="doc-p">{t("personal_data_description")}</p>
      <ul className="doc-list">
        <li>{t("usage_data")}</li>
      </ul>
      <h4 className="doc-heading-4">{t("usage_data")}</h4>
      <p className="doc-p">{t("usage_data_auto_collected")}</p>
      <p className="doc-p">{t("mobile_device_info_collection")}</p>
      <p className="doc-p">{t("browser_info_collection")}</p>
      <h4 className="doc-heading-4">
        {t("tracking_technologies_and_cookies")}
      </h4>
      <p className="doc-p">
        {t("tracking_technologies_and_cookies_description")}
      </p>
      <ul className="doc-list">
        <li>
          <strong>{t("cookies_or_browser_cookies")}</strong>{" "}
          {t("cookies_description")}
        </li>
        <li>
          <strong>{t("web_beacons")}</strong> {t("web_beacons_description")}
        </li>
      </ul>
      <p className="doc-p">{t("cookies_paragraph")}</p>
      <p className="doc-p">{t("purpose_of_cookies")}</p>
      <ul className="doc-list">
        <li>
          <p className="doc-p--strong">{t("necessary_cookies_title")}</p>
          <p className="doc-p">{t("session_cookies")}</p>
          <p className="doc-p">{t("administered_by")}</p>
          <p className="doc-p">{t("necessary_cookies_purpose")}</p>
        </li>
        <li>
          <p className="doc-p--strong">{t("cookies_policy_title")}</p>
          <p className="doc-p">{t("persistent_cookies")}</p>
          <p className="doc-p">{t("administered_by")}</p>
          <p className="doc-p">{t("cookies_policy_purpose")}</p>
        </li>
        <li>
          <p className="doc-p--strong">{t("functionality_cookies_title")}</p>
          <p className="doc-p">{t("persistent_cookies")}</p>
          <p className="doc-p">{t("administered_by")}</p>
          <p className="doc-p">{t("functionality_cookies_purpose")}</p>
        </li>
      </ul>
      <p className="doc-p">{t("cookies_policy_info")}</p>
      <h3 className="doc-heading-3">{t("use_of_personal_data")}</h3>
      <p className="doc-p">{t("personal_data_purposes")}</p>
      <ul className="doc-list">
        <li>
          <strong>{t("provide_and_maintain_service")}</strong>{" "}
          {t("provide_and_maintain_service_desc")}
        </li>
        <li>
          <strong>{t("manage_account")}</strong> {t("manage_account_desc")}
        </li>
        <li>
          <strong>{t("performance_of_contract")}</strong>{" "}
          {t("performance_of_contract_desc")}
        </li>
        <li>
          <strong>{t("contact_you")}</strong> {t("contact_you_desc")}
        </li>
        <li>
          <strong>{t("provide_news_and_offers")}</strong>{" "}
          {t("provide_news_and_offers_desc")}
        </li>
        <li>
          <strong>{t("manage_requests")}</strong> {t("manage_requests_desc")}
        </li>
        <li>
          <strong>{t("business_transfers")}</strong>{" "}
          {t("business_transfers_desc")}
        </li>
        <li>
          <strong>{t("other_purposes")}</strong> {t("other_purposes_desc")}
        </li>
      </ul>
      <p className="doc-p">{t("personal_data_sharing")}</p>
      <ul className="doc-list">
        <li>
          <strong>{t("with_service_providers")}</strong>{" "}
          {t("with_service_providers_desc")}
        </li>
        <li>
          <strong>{t("for_business_transfers")}</strong>{" "}
          {t("for_business_transfers_desc")}
        </li>
        <li>
          <strong>{t("with_affiliates")}</strong> {t("with_affiliates_desc")}
        </li>
        <li>
          <strong>{t("with_business_partners")}</strong>{" "}
          {t("with_business_partners_desc")}
        </li>
        <li>
          <strong>{t("with_other_users")}</strong> {t("with_other_users_desc")}
        </li>
        <li>
          <strong>{t("with_consent")}</strong> {t("with_consent_desc")}
        </li>
      </ul>
      <h3 className="doc-heading-3">{t("retention_of_personal_data")}</h3>
      <p className="doc-p">{t("retention_policy_paragraph1")}</p>
      <p className="doc-p">{t("retention_policy_paragraph2")}</p>

      <h3 className="doc-heading-3">{t("transfer_of_personal_data")}</h3>
      <p className="doc-p">{t("transfer_info_paragraph1")}</p>
      <p className="doc-p">{t("transfer_info_paragraph2")}</p>
      <p className="doc-p">{t("transfer_info_paragraph3")}</p>

      <h3 className="doc-heading-3">{t("delete_personal_data")}</h3>
      <p className="doc-p">{t("delete_info_paragraph1")}</p>
      <p className="doc-p">{t("delete_info_paragraph2")}</p>
      <p className="doc-p">{t("delete_info_paragraph3")}</p>
      <p className="doc-p">{t("delete_info_paragraph4")}</p>

      <h3 className="doc-heading-3">{t("disclosure_of_personal_data")}</h3>
      <h4 className="doc-heading-4">{t("business_transactions")}</h4>
      <p className="doc-p">{t("business_transactions_paragraph")}</p>

      <h4 className="doc-heading-4">{t("law_enforcement")}</h4>
      <p className="doc-p">{t("law_enforcement_paragraph")}</p>

      <h4 className="doc-heading-4">{t("other_legal_requirements")}</h4>
      <p className="doc-p">{t("other_legal_requirements_paragraph")}</p>
      <ul className="doc-list">
        <li>{t("legal_requirement_item1")}</li>
        <li>{t("legal_requirement_item2")}</li>
        <li>{t("legal_requirement_item3")}</li>
        <li>{t("legal_requirement_item4")}</li>
        <li>{t("legal_requirement_item5")}</li>
      </ul>

      <h3 className="doc-heading-3">{t("security_of_personal_data")}</h3>
      <p className="doc-p">{t("security_paragraph")}</p>

      <h2 className="doc-heading-2">{t("childrens_privacy")}</h2>
      <p className="doc-p">{t("childrens_privacy_paragraph1")}</p>
      <p className="doc-p">{t("childrens_privacy_paragraph2")}</p>

      <h2 className="doc-heading-2">{t("links_to_other_websites")}</h2>
      <p className="doc-p">{t("links_to_other_websites_paragraph1")}</p>
      <p className="doc-p">{t("links_to_other_websites_paragraph2")}</p>

      <h2 className="doc-heading-2">{t("changes_to_privacy_policy")}</h2>
      <p className="doc-p">{t("changes_to_privacy_policy_paragraph1")}</p>
      <p className="doc-p">{t("changes_to_privacy_policy_paragraph2")}</p>
      <p className="doc-p">{t("changes_to_privacy_policy_paragraph3")}</p>

      <h2 className="doc-heading-2">{t("contact_us")}</h2>
      <p className="doc-p">{t("contact_us_paragraph")}</p>

      <ul className="doc-list">
        <li>
          {t("contact_us_by_email")}{" "}
          <a
            target="_blank"
            rel="external noopener noreferrer"
            className="doc-link"
            href="mailto:boilerplates@brocoders.com"
          >
            boilerplates@brocoders.com
          </a>
        </li>
        <li>
          {t("contact_us_on_website")}{" "}
          <a
            target="_blank"
            rel="external noopener noreferrer"
            className="doc-link"
            href="https://bcboilerplates.com/"
          >
            bc boilerplates
          </a>
        </li>
        <li>
          {t("contact_us_on_github_discussions")}{" "}
          <a
            target="_blank"
            rel="external noopener noreferrer"
            className="doc-link"
            href="https://github.com/brocoders/nestjs-boilerplate/discussions"
          >
            nestjs-boilerplate
          </a>{" "}
          {t("contact_us_on_github_discussions_or")}{" "}
          <a
            target="_blank"
            rel="external noopener noreferrer"
            className="doc-link"
            href="https://github.com/brocoders/extensive-react-boilerplate/discussions"
          >
            extensive-react-boilerplate
          </a>
        </li>
        <li>
          {t("contact_us_on_discord")}{" "}
          <a
            target="_blank"
            rel="external noopener noreferrer"
            className="doc-link"
            href="https://discord.com/channels/520622812742811698/1197293125434093701"
          >
            channel
          </a>
        </li>
      </ul>
    </div>
  );
}
export default PrivacyPolicy;
